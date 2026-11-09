package io.github.hienpham0344.stayfinder.auth.service;

import io.github.hienpham0344.stayfinder.auth.entity.*;
import io.github.hienpham0344.stayfinder.auth.repository.*;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.security.SupabaseJwtDecoder;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.user.service.UserProfileProjection;
import org.junit.jupiter.api.*;
import org.springframework.security.oauth2.jwt.Jwt;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

class SupabaseAdoptionTest {
    UserRepository users=mock(UserRepository.class);RefreshSessionRepository sessions=mock(RefreshSessionRepository.class);
    AuthAuditRepository audit=mock(AuthAuditRepository.class);SupabaseJwtDecoder decoder=mock(SupabaseJwtDecoder.class);
    Instant now=Instant.parse("2026-11-09T00:00:00Z");UUID id=UUID.randomUUID(),sid=UUID.randomUUID();
    SupabaseAuthService service;JsonNode response;User existing;
    @BeforeEach void setup(){
        service=new SupabaseAuthService(mock(SupabaseAuthClient.class),decoder,users,sessions,mock(UserProfileProjection.class),Clock.fixed(now,ZoneOffset.UTC),audit);
        response=new JsonMapper().createObjectNode().put("access_token","signed").put("refresh_token","refresh");
        when(decoder.decode("signed")).thenReturn(Jwt.withTokenValue("signed").header("alg","RS256").subject(id.toString())
            .claim("email","user@example.com").claim("session_id",sid.toString()).claim("user_metadata",Map.of("role","ADMIN"))
            .issuedAt(now.minusSeconds(30)).expiresAt(now.plusSeconds(300)).build());
        existing=new User();existing.setId(id);existing.setEmail("user@example.com");existing.setRole(UserRole.PARTNER);existing.setCredentialState("active");
    }
    @Test void newProviderSubjectCanOnlyProvisionCustomer(){
        service.adopt(response);
        verify(users).save(argThat(u->u.getId().equals(id)&&u.getRole()==UserRole.CUSTOMER&&u.getPasswordHash()==null));
        verify(sessions).save(argThat(s->s.getId().equals(sid)&&s.getUserId().equals(id)));
    }
    @Test void emailDoesNotLinkAnotherIdentity(){
        existing.setId(UUID.randomUUID());when(users.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(existing));
        assertThrows(BusinessException.class,()->service.adopt(response));verify(users,never()).save(any());verifyNoInteractions(sessions);
    }
    @Test void disabledUserCannotReactivateThroughProvider(){
        existing.setCredentialState("disabled");when(users.lockById(id)).thenReturn(Optional.of(existing));
        assertThrows(BusinessException.class,()->service.adopt(response));verify(users,never()).save(any());verifyNoInteractions(sessions);
    }
    @Test void existingTrustedRoleIsPreserved(){
        when(users.lockById(id)).thenReturn(Optional.of(existing));service.adopt(response);assertEquals(UserRole.PARTNER,existing.getRole());
    }
    @Test void tokenIssuedBeforePasswordResetCannotCreateNewLocalSession(){
        existing.setEmail("new-confirmed@example.com");
        when(users.lockById(id)).thenReturn(Optional.of(existing));AuthAuditEvent event=new AuthAuditEvent();event.setOccurredAt(now.minusSeconds(10));
        when(audit.findFirstByUserIdAndActionOrderByOccurredAtDesc(id,"supabase_credentials_changed")).thenReturn(Optional.of(event));
        assertThrows(BusinessException.class,()->service.adopt(response));verifyNoInteractions(sessions);
        verify(users,never()).save(any());assertEquals("new-confirmed@example.com",existing.getEmail());
    }
    @Test void refreshCannotReviveRevokedSession(){
        when(users.lockById(id)).thenReturn(Optional.of(existing));RefreshSession old=new RefreshSession();old.setId(sid);old.setUserId(id);old.setExpiresAt(now.plusSeconds(500));old.setRevokedAt(now.minusSeconds(2));
        when(sessions.lockById(sid)).thenReturn(Optional.of(old));assertThrows(BusinessException.class,()->service.adopt(response));verify(sessions,never()).save(any());
    }
}
