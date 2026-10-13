package io.github.hienpham0344.stayfinder.auth;

import io.github.hienpham0344.stayfinder.auth.dto.*;
import io.github.hienpham0344.stayfinder.auth.entity.*;
import io.github.hienpham0344.stayfinder.auth.repository.*;
import io.github.hienpham0344.stayfinder.auth.service.AuthServiceImpl;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.security.*;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private final UserRepository users=mock(UserRepository.class);
    private final RefreshSessionRepository sessions=mock(RefreshSessionRepository.class);
    private final RefreshTokenRepository tokens=mock(RefreshTokenRepository.class);
    private final AuthAuditRepository audit=mock(AuthAuditRepository.class);
    private final BCryptPasswordEncoder passwords=new BCryptPasswordEncoder(4);
    private final Map<UUID,User> userRows=new HashMap<>();
    private final Map<UUID,RefreshSession> sessionRows=new HashMap<>();
    private final Map<UUID,RefreshToken> tokenRows=new HashMap<>();
    private final List<AuthAuditEvent> auditRows=new ArrayList<>();
    private final MutableClock clock=new MutableClock();
    private AuthServiceImpl service;

    @BeforeEach void setup() {
        when(users.findByEmailIgnoreCase(anyString())).thenAnswer(i->userRows.values().stream()
            .filter(u->u.getEmail()!=null&&u.getEmail().trim().equalsIgnoreCase(i.getArgument(0))).findFirst());
        when(users.findById(any())).thenAnswer(i->Optional.ofNullable(userRows.get(i.getArgument(0))));
        when(users.lockById(any())).thenAnswer(i->Optional.ofNullable(userRows.get(i.getArgument(0))));
        when(users.saveAndFlush(any())).thenAnswer(i->{User u=i.getArgument(0);userRows.put(u.getId(),u);return u;});
        when(sessions.save(any())).thenAnswer(i->{RefreshSession s=i.getArgument(0);sessionRows.put(s.getId(),s);return s;});
        when(sessions.lockById(any())).thenAnswer(i->Optional.ofNullable(sessionRows.get(i.getArgument(0))));
        when(tokens.save(any())).thenAnswer(i->{RefreshToken v=i.getArgument(0);tokenRows.put(v.getId(),v);return v;});
        when(tokens.findByTokenHash(anyString())).thenAnswer(i->tokenRows.values().stream()
            .filter(v->v.getTokenHash().equals(i.getArgument(0))).findFirst());
        when(tokens.lockById(any())).thenAnswer(i->Optional.ofNullable(tokenRows.get(i.getArgument(0))));
        doAnswer(i->{UUID id=i.getArgument(0); Instant now=i.getArgument(1);
            sessionRows.values().stream().filter(s->s.getUserId().equals(id)).forEach(s->s.setRevokedAt(now));return null;
        }).when(sessions).revokeAllForUser(any(),any());
        when(audit.save(any())).thenAnswer(i->{AuthAuditEvent event=i.getArgument(0);auditRows.add(event);return event;});
        DaoAuthenticationProvider provider=new DaoAuthenticationProvider(new CustomUserDetailsService(users));
        provider.setPasswordEncoder(passwords);
        String secret=Base64.getEncoder().encodeToString("01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
        service=new AuthServiceImpl(new ProviderManager(provider),users,sessions,tokens,passwords,
            new JwtTokenProvider(secret,clock),new io.github.hienpham0344.stayfinder.user.service.UserProfileProjection(Mappers.getMapper(UserMapper.class),mock(io.github.hienpham0344.stayfinder.reward.repository.RewardWalletRepository.class)),audit,clock);
    }

    @Test void registersNormalizedEmailWithBcryptAndServerOwnedCustomerIdentity() {
        AuthSessionResponse result=enroll(new RegisterRequest(" Hien ", " Hien@Example.com ", "ExamplePass9"));
        User stored=userRows.get(result.user().id());
        assertEquals("hien@example.com",stored.getEmail());
        assertEquals("Hien",stored.getFullName());
        assertEquals(UserRole.CUSTOMER,stored.getRole());
        assertEquals(0,stored.getLoyaltyPoints());
        assertTrue(passwords.matches("ExamplePass9",stored.getPasswordHash()));
        assertEquals("active",stored.getCredentialState());
        assertEquals(clock.instant().plusSeconds(900),result.expiresAt());
        assertNotEquals(result.refreshToken(),tokenRows.values().iterator().next().getTokenHash());
        assertEquals(64,tokenRows.values().iterator().next().getTokenHash().length());
        assertEquals(result.sessionId(),sessionRows.values().iterator().next().getId());
    }

    @Test void duplicateNormalizedEmailIsRejectedWithoutCreatingASecondIdentity() {
        enroll(new RegisterRequest("Hien","hien@example.com","ExamplePass9"));
        assertCode("EMAIL_ALREADY_EXISTS",()->service.register(new RegisterRequest("Other"," HIEN@example.com ","ExamplePass9")));
        assertEquals(1,userRows.size());
    }

    @Test void rejectsOver72Utf8BytesAndDoesNotTrimPasswords() {
        assertCode("VALIDATION_ERROR",()->service.register(new RegisterRequest("Hien","hien@example.com","é".repeat(37))));
        AuthSessionResponse result=enroll(new RegisterRequest("Hien","hien@example.com"," Password9 "));
        assertTrue(passwords.matches(" Password9 ",userRows.get(result.user().id()).getPasswordHash()));
        assertCode("INVALID_CREDENTIALS",()->service.login(new LoginRequest("hien@example.com","Password9")));
    }

    @Test void wrongAndUnenrolledCredentialsShareTheSameError() {
        enroll(new RegisterRequest("Hien","hien@example.com","ExamplePass9"));
        assertCode("INVALID_CREDENTIALS",()->service.login(new LoginRequest("hien@example.com","wrongpass")));
        User user=userRows.values().iterator().next();user.setCredentialState("pending_enrollment");
        assertCode("INVALID_CREDENTIALS",()->service.login(new LoginRequest("hien@example.com","ExamplePass9")));
        assertCode("INVALID_CREDENTIALS",()->service.login(new LoginRequest("absent@example.com","ExamplePass9")));
    }

    @Test void refreshRotatesOnceAndRevokesTheFamilyAfterReplayGrace() {
        AuthSessionResponse initial=enroll(new RegisterRequest("Hien","hien@example.com","ExamplePass9"));
        AuthSessionResponse replacement=service.refresh(initial.refreshToken());
        assertEquals(initial.sessionId(),replacement.sessionId());
        assertNotEquals(initial.refreshToken(),replacement.refreshToken());
        assertEquals(2,tokenRows.size());
        assertCode("REFRESH_RETRY",()->service.refresh(initial.refreshToken()));
        assertNull(sessionRows.get(initial.sessionId()).getRevokedAt());
        clock.now=clock.now.plusSeconds(11);
        assertCode("SESSION_REVOKED",()->service.refresh(initial.refreshToken()));
        assertNotNull(sessionRows.get(initial.sessionId()).getRevokedAt());
        assertCode("SESSION_REVOKED",()->service.refresh(replacement.refreshToken()));
    }

    @Test void logoutIsIdempotentAndRevokesAccessSessionWithoutAnAccessToken() {
        AuthSessionResponse initial=enroll(new RegisterRequest("Hien","hien@example.com","ExamplePass9"));
        service.logout(initial.refreshToken()); service.logout(initial.refreshToken()); service.logout("invalid");
        assertNotNull(sessionRows.get(initial.sessionId()).getRevokedAt());
        assertCode("SESSION_REVOKED",()->service.refresh(initial.refreshToken()));
    }

    @Test void passwordAndEmailChangesVerifyCurrentPasswordRevokeSessionsAndAudit() {
        AuthSessionResponse initial=enroll(new RegisterRequest("Hien","hien@example.com","ExamplePass9"));
        UUID id=initial.user().id();
        assertCode("INVALID_CREDENTIALS",()->service.changePassword(id,new PasswordChangeRequest("wrongpass","NewPassword9")));
        assertNull(sessionRows.get(initial.sessionId()).getRevokedAt());
        service.changePassword(id,new PasswordChangeRequest("ExamplePass9","NewPassword9"));
        assertNotNull(sessionRows.get(initial.sessionId()).getRevokedAt());
        assertCode("INVALID_CREDENTIALS",()->service.login(new LoginRequest("hien@example.com","ExamplePass9")));
        AuthSessionResponse next=service.login(new LoginRequest("hien@example.com","NewPassword9"));
        service.changeEmail(id,new EmailChangeRequest("NewPassword9"," New@Example.com "));
        assertEquals("new@example.com",userRows.get(id).getEmail());
        assertNotNull(sessionRows.get(next.sessionId()).getRevokedAt());
        assertEquals(List.of("password_changed","email_changed"),auditRows.stream().map(AuthAuditEvent::getAction).toList());
    }

    @Test void expiredRefreshDoesNotIssueANewToken() {
        AuthSessionResponse initial=enroll(new RegisterRequest("Hien","hien@example.com","ExamplePass9"));
        clock.now=clock.now.plus(Duration.ofDays(30));
        assertCode("SESSION_EXPIRED",()->service.refresh(initial.refreshToken()));
        assertEquals(1,tokenRows.size());
    }

    private AuthSessionResponse enroll(RegisterRequest request) { return assertDoesNotThrow(()->service.register(request)); }

    private static void assertCode(String code,Runnable operation) {
        assertEquals(code,assertThrows(BusinessException.class,operation::run).getErrorCode().getCode());
    }
    static final class MutableClock extends Clock {
        Instant now=Instant.parse("2026-10-12T12:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;} public Clock withZone(ZoneId z){return this;}
        public Instant instant(){return now;}
    }
}
