package io.github.hienpham0344.stayfinder.auth.service;

import io.github.hienpham0344.stayfinder.auth.dto.*;
import io.github.hienpham0344.stayfinder.auth.entity.*;
import io.github.hienpham0344.stayfinder.auth.repository.*;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.security.JwtTokenProvider;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.service.UserProfileProjection;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AuthServiceImpl implements AuthService {
    private static final Pattern EMAIL=Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern REFRESH=Pattern.compile("[A-Za-z0-9_-]{43}");
    private final AuthenticationManager authentication;
    private final UserRepository users;
    private final RefreshSessionRepository sessions;
    private final RefreshTokenRepository tokens;
    private final PasswordEncoder passwords;
    private final JwtTokenProvider jwt;
    private final UserProfileProjection mapper;
    private final AuthAuditRepository audit;
    private final Clock clock;
    private final SecureRandom random=new SecureRandom();

    public AuthServiceImpl(AuthenticationManager authentication,UserRepository users,RefreshSessionRepository sessions,
            RefreshTokenRepository tokens,PasswordEncoder passwords,JwtTokenProvider jwt,UserProfileProjection mapper,
            AuthAuditRepository audit,Clock clock) {
        this.authentication=authentication; this.users=users; this.sessions=sessions; this.tokens=tokens;
        this.passwords=passwords; this.jwt=jwt; this.mapper=mapper; this.audit=audit; this.clock=clock;
    }

    @Override @Transactional
    public AuthSessionResponse register(RegisterRequest request) {
        String email=normalizeEmail(request.email()); validatePassword(request.password());
        String name=request.fullName()==null?"":request.fullName().trim();
        if(name.isBlank()||name.length()>120)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        ensureUniqueEmail(email,null);
        User user=new User();user.setId(UUID.randomUUID());user.setFullName(name);user.setEmail(email);
        user.setRole(UserRole.CUSTOMER);user.setLoyaltyPoints(0);user.setLoyaltyTier(0);
        user.setPasswordHash(passwords.encode(request.password()));user.setCredentialState("active");user.setCreatedAt(clock.instant());
        saveIdentity(user);
        return createSession(user);
    }

    @Override @Transactional
    public AuthSessionResponse login(LoginRequest request) {
        String email=normalizeLoginEmail(request.email());
        User existing=users.findByEmailIgnoreCase(email).orElseThrow(()->new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        // Serialize credential changes with session creation before the provider verifies the password.
        User user=users.lockById(existing.getId()).orElseThrow(()->new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if(!active(user)||!boundedPassword(request.password()))throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        try {
            authentication.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(email,request.password()));
        } catch(AuthenticationException exception) {throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);}
        return createSession(user);
    }

    @Override @Transactional(noRollbackFor=SessionReplayException.class)
    public AuthSessionResponse refresh(String rawRefreshToken) {
        RefreshToken located=findRefresh(rawRefreshToken).orElseThrow(()->new BusinessException(ErrorCode.SESSION_EXPIRED));
        // Family lock precedes token lock. Credential updates never acquire a family then user write lock.
        RefreshSession session=sessions.lockById(located.getSessionId())
                .orElseThrow(()->new BusinessException(ErrorCode.SESSION_EXPIRED));
        requireLive(session);
        RefreshToken old=tokens.lockById(located.getId()).orElseThrow(()->new BusinessException(ErrorCode.SESSION_EXPIRED));
        Instant now=clock.instant();
        if(old.getConsumedAt()!=null) {
            if(now.isBefore(old.getConsumedAt().plusSeconds(10)))throw new BusinessException(ErrorCode.REFRESH_RETRY);
            session.setRevokedAt(now);sessions.save(session);
            // This exception must commit family revocation instead of rolling it back.
            throw new SessionReplayException();
        }
        if(!now.isBefore(old.getExpiresAt()))throw new BusinessException(ErrorCode.SESSION_EXPIRED);
        User user=users.findById(session.getUserId()).filter(AuthServiceImpl::active)
                .orElseThrow(()->new BusinessException(ErrorCode.SESSION_REVOKED));
        RawToken replacement=issueRefresh(session);
        old.setConsumedAt(now);old.setReplacedBy(replacement.row().getId());tokens.save(old);
        return response(user,session,replacement.raw());
    }

    @Override @Transactional
    public void logout(String rawRefreshToken) {
        findRefresh(rawRefreshToken).ifPresent(token->sessions.lockById(token.getSessionId()).ifPresent(session->{
            if(session.getRevokedAt()==null){session.setRevokedAt(clock.instant());sessions.save(session);}
        }));
    }

    @Override @Transactional
    public void changePassword(UUID userId,PasswordChangeRequest request) {
        User user=reauthenticate(userId,request.currentPassword());validatePassword(request.newPassword());
        user.setPasswordHash(passwords.encode(request.newPassword()));saveIdentity(user);
        revokeAndAudit(userId,"password_changed");
    }

    @Override @Transactional
    public void changeEmail(UUID userId,EmailChangeRequest request) {
        User user=reauthenticate(userId,request.currentPassword());
        String email=normalizeEmail(request.newEmail());ensureUniqueEmail(email,userId);user.setEmail(email);
        saveIdentity(user);revokeAndAudit(userId,"email_changed");
    }

    private User reauthenticate(UUID userId,String password) {
        User user=users.lockById(userId).orElseThrow(()->new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if(!active(user)||!boundedPassword(password)||!passwords.matches(password,user.getPasswordHash()))
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        return user;
    }
    private void revokeAndAudit(UUID userId,String action) {
        Instant now=clock.instant();sessions.revokeAllForUser(userId,now);
        AuthAuditEvent event=new AuthAuditEvent();event.setId(UUID.randomUUID());event.setUserId(userId);
        event.setAction(action);event.setOccurredAt(now);audit.save(event);
    }
    private void saveIdentity(User user) {
        try {users.saveAndFlush(user);}
        catch(DataIntegrityViolationException exception) {throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);}
    }
    private void ensureUniqueEmail(String email,UUID owner) {
        if(users.findByEmailIgnoreCase(email).filter(u->!u.getId().equals(owner)).isPresent())
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
    private AuthSessionResponse createSession(User user) {
        Instant now=clock.instant();RefreshSession session=new RefreshSession();
        session.setId(UUID.randomUUID());session.setUserId(user.getId());session.setCreatedAt(now);
        session.setExpiresAt(now.plus(Duration.ofDays(30)));sessions.save(session);
        return response(user,session,issueRefresh(session).raw());
    }
    private RawToken issueRefresh(RefreshSession session) {
        byte[] bytes=new byte[32];random.nextBytes(bytes);
        String raw=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshToken row=new RefreshToken();row.setId(UUID.randomUUID());row.setSessionId(session.getId());
        row.setTokenHash(hash(raw));row.setIssuedAt(clock.instant());row.setExpiresAt(session.getExpiresAt());tokens.save(row);
        return new RawToken(raw,row);
    }
    private AuthSessionResponse response(User user,RefreshSession session,String refresh) {
        return new AuthSessionResponse(jwt.issue(user.getId(),session.getId()),"Bearer",clock.instant().plusSeconds(900),
                session.getId(),mapper.toResponse(user),refresh);
    }
    private Optional<RefreshToken> findRefresh(String raw) {
        return raw==null||!REFRESH.matcher(raw).matches()?Optional.empty():tokens.findByTokenHash(hash(raw));
    }
    private void requireLive(RefreshSession session) {
        if(session.getRevokedAt()!=null)throw new BusinessException(ErrorCode.SESSION_REVOKED);
        if(!clock.instant().isBefore(session.getExpiresAt()))throw new BusinessException(ErrorCode.SESSION_EXPIRED);
    }
    public static boolean active(User user) {
        return "active".equals(user.getCredentialState())&&user.getRole()!=null
                &&user.getPasswordHash()!=null&&!user.getPasswordHash().isBlank();
    }
    private static String normalizeLoginEmail(String raw) {
        if(raw==null||raw.length()>320)throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        return raw.trim().toLowerCase(Locale.ROOT);
    }
    private static String normalizeEmail(String raw) {
        if(raw==null)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        String email=raw.trim().toLowerCase(Locale.ROOT);
        if(email.length()>320||!EMAIL.matcher(email).matches())throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        return email;
    }
    private static boolean boundedPassword(String raw) {
        return raw!=null&&raw.getBytes(StandardCharsets.UTF_8).length<=72;
    }
    private static void validatePassword(String raw) {
        if(!boundedPassword(raw)||raw.codePointCount(0,raw.length())<8)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
    }
    private static String hash(String raw) {
        try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.US_ASCII)));}
        catch(NoSuchAlgorithmException exception){throw new IllegalStateException("SHA-256 unavailable",exception);}
    }
    private record RawToken(String raw,RefreshToken row) {}
    public static final class SessionReplayException extends BusinessException {
        public SessionReplayException(){super(ErrorCode.SESSION_REVOKED);}
    }
}
