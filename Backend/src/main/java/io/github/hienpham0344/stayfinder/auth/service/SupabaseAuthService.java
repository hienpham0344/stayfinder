package io.github.hienpham0344.stayfinder.auth.service;

import io.github.hienpham0344.stayfinder.auth.dto.*;
import io.github.hienpham0344.stayfinder.auth.entity.RefreshSession;
import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.auth.repository.AuthAuditRepository;
import io.github.hienpham0344.stayfinder.auth.entity.AuthAuditEvent;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.security.SupabaseJwtDecoder;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.user.service.UserProfileProjection;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import java.time.*;
import java.util.*;

/** Supabase owns credentials; local identity and session rows remain the authorization authority. */
@Service @ConditionalOnProperty(name="stayfinder.auth.mode",havingValue="supabase")
public class SupabaseAuthService implements AuthService {
    private final SupabaseAuthClient remote; private final SupabaseJwtDecoder decoder;
    private final UserRepository users; private final RefreshSessionRepository sessions;
    private final UserProfileProjection profiles; private final Clock clock;
    private final AuthAuditRepository audit;
    public SupabaseAuthService(SupabaseAuthClient remote,SupabaseJwtDecoder decoder,UserRepository users,
            RefreshSessionRepository sessions,UserProfileProjection profiles,Clock clock,AuthAuditRepository audit){
        this.remote=remote;this.decoder=decoder;this.users=users;this.sessions=sessions;this.profiles=profiles;this.clock=clock;this.audit=audit;
    }
    @Override @Transactional public AuthSessionResponse register(RegisterRequest body){
        JsonNode result=remote.call("POST","/signup",Map.of("email",body.email().trim(),"password",body.password(),
            "data",Map.of("full_name",body.fullName().trim())),null);
        // Confirmation-enabled projects return a user but no tokens. No local identity is trusted yet.
        return result.path("access_token").asText("").isBlank()?null:adopt(result);
    }
    @Override @Transactional public AuthSessionResponse login(LoginRequest body){return adopt(passwordGrant(body.email(),body.password()));}
    @Override @Transactional public AuthSessionResponse refresh(String token){return adopt(refreshGrant(token));}
    @Override @Transactional(noRollbackFor=BusinessException.class) public void logout(String token){
        if(token==null||token.isBlank())return;
        JsonNode response=refreshGrant(token);var jwt=verifiedToken(response);
        UUID sid=UUID.fromString(jwt.getClaimAsString("session_id"));
        sessions.lockById(sid).ifPresent(s->{s.setRevokedAt(clock.instant());sessions.save(s);});
        remote.call("POST","/logout?scope=local",Map.of(),jwt.getTokenValue());
    }
    @Override @Transactional(noRollbackFor=BusinessException.class) public void changePassword(UUID id,PasswordChangeRequest request){
        User user=activeUser(id);JsonNode result=passwordGrant(user.getEmail(),request.currentPassword());
        var jwt=verifiedToken(result);
        if(!id.toString().equals(jwt.getSubject()))throw invalid();
        remote.call("PUT","/user",Map.of("password",request.newPassword()),jwt.getTokenValue());
        invalidateCredentials(id);
        remote.call("POST","/logout?scope=global",Map.of(),jwt.getTokenValue());
    }
    @Override @Transactional(noRollbackFor=BusinessException.class) public void changeEmail(UUID id,EmailChangeRequest request){
        User user=activeUser(id);var jwt=verifiedToken(passwordGrant(user.getEmail(),request.currentPassword()));
        if(!id.toString().equals(jwt.getSubject()))throw invalid();
        remote.call("PUT","/user",Map.of("email",request.newEmail()),jwt.getTokenValue());
        // Keep the current email until Supabase confirms the change and issues a new session.
        invalidateCredentials(id);
        remote.call("POST","/logout?scope=global",Map.of(),jwt.getTokenValue());
    }
    public void recover(String email){
        try{remote.call("POST","/recover",Map.of("email",email.trim()),null);}
        catch(BusinessException e){if(e.getErrorCode()!=ErrorCode.INVALID_CREDENTIALS)throw e;}
    }
    @Transactional(noRollbackFor=BusinessException.class) public void reset(String tokenHash,String password){
        // Only a one-time recovery proof can enter this path; ordinary JWTs are not reset proofs.
        var result=remote.call("POST","/verify",Map.of("type","recovery","token_hash",tokenHash),null);
        var jwt=verifiedToken(result);
        UUID id=UUID.fromString(jwt.getSubject());
        // Establish/lock local identity before mutation so later sign-ins can check its cutoff.
        adopt(result);
        remote.call("PUT","/user",Map.of("password",password),jwt.getTokenValue());
        invalidateCredentials(id);
        remote.call("POST","/logout?scope=global",Map.of(),jwt.getTokenValue());
    }
    private JsonNode passwordGrant(String email,String password){
        return remote.call("POST","/token?grant_type=password",Map.of("email",email.trim(),"password",password),null);
    }
    private JsonNode refreshGrant(String token){
        if(token==null||token.isBlank()||token.length()>4096)throw invalid();
        return remote.call("POST","/token?grant_type=refresh_token",Map.of("refresh_token",token),null);
    }
    private User activeUser(UUID id){return users.lockById(id).filter(u->"active".equals(u.getCredentialState())&&u.getRole()!=null).orElseThrow(SupabaseAuthService::invalid);}
    AuthSessionResponse adopt(JsonNode result){
        var jwt=verifiedToken(result);
        UUID id=UUID.fromString(jwt.getSubject()),sid=UUID.fromString(jwt.getClaimAsString("session_id"));
        String email=jwt.getClaimAsString("email");
        if(email==null||email.isBlank()||email.length()>320)throw invalid();
        User user=users.lockById(id).orElse(null);
        var cutoff=audit.findFirstByUserIdAndActionOrderByOccurredAtDesc(id,"supabase_credentials_changed");
        if(cutoff.isPresent()&&(jwt.getIssuedAt()==null||!jwt.getIssuedAt().isAfter(cutoff.get().getOccurredAt())))throw invalid();
        if(user==null){
            // Never link by email: only the verified provider subject binds identity.
            if(users.findByEmailIgnoreCase(email).isPresent())throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
            user=new User();user.setId(id);user.setEmail(email);user.setRole(UserRole.CUSTOMER);
            String display=result.path("user").path("user_metadata").path("full_name").asText("").trim();
            user.setFullName(!display.isBlank()&&display.length()<=120?display:email.substring(0,email.indexOf('@')>0?email.indexOf('@'):email.length()));
            user.setCredentialState("active");user.setLoyaltyPoints(0);user.setLoyaltyTier(0);user.setCreatedAt(clock.instant());
            users.save(user);
        }else{
            if(!"active".equals(user.getCredentialState())||user.getRole()==null)throw invalid();
            if(!email.equalsIgnoreCase(user.getEmail())){
                if(users.findByEmailIgnoreCase(email).filter(u->!u.getId().equals(id)).isPresent())throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
                user.setEmail(email);users.save(user);
            }
        }
        RefreshSession session=sessions.lockById(sid).orElse(null);
        if(session==null){session=new RefreshSession();session.setId(sid);session.setUserId(id);session.setCreatedAt(clock.instant());session.setExpiresAt(clock.instant().plus(Duration.ofDays(30)));}
        if(!id.equals(session.getUserId())||session.getRevokedAt()!=null||!clock.instant().isBefore(session.getExpiresAt()))throw invalid();
        sessions.save(session);
        String refresh=result.path("refresh_token").asText("");if(refresh.isBlank())throw invalid();
        return new AuthSessionResponse(jwt.getTokenValue(),"Bearer",jwt.getExpiresAt(),sid,profiles.toResponse(user),refresh);
    }
    private static BusinessException invalid(){return new BusinessException(ErrorCode.INVALID_CREDENTIALS);}
    private void invalidateCredentials(UUID id){
        sessions.revokeAllForUser(id,clock.instant());
        var event=new AuthAuditEvent();event.setId(UUID.randomUUID());event.setUserId(id);
        event.setAction("supabase_credentials_changed");event.setOccurredAt(clock.instant());audit.save(event);
    }
    private org.springframework.security.oauth2.jwt.Jwt verifiedToken(JsonNode response){
        try{return decoder.decode(response.path("access_token").asText(""));}
        catch(org.springframework.security.oauth2.jwt.JwtException exception){throw invalid();}
    }
}
