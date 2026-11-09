package io.github.hienpham0344.stayfinder.auth;
import io.github.hienpham0344.stayfinder.auth.service.*;
import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.security.SupabaseJwtDecoder;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.user.service.UserProfileProjection;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.junit.jupiter.api.*;
import org.springframework.security.oauth2.jwt.Jwt;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

class SupabaseRecoveryTest {
    SupabaseAuthClient remote=mock(SupabaseAuthClient.class);SupabaseJwtDecoder decoder=mock(SupabaseJwtDecoder.class);
    RefreshSessionRepository sessions=mock(RefreshSessionRepository.class);Instant now=Instant.parse("2026-11-09T00:00:00Z");
    SupabaseAuthService service=new SupabaseAuthService(remote,decoder,mock(UserRepository.class),sessions,mock(UserProfileProjection.class),Clock.fixed(now,ZoneOffset.UTC),mock(io.github.hienpham0344.stayfinder.auth.repository.AuthAuditRepository.class));
    @Test void hidesUnknownEmailButDoesNotHideOutage(){
        when(remote.call(eq("POST"),eq("/recover"),anyMap(),isNull())).thenThrow(new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        assertDoesNotThrow(()->service.recover("unknown@example.com"));
        when(remote.call(eq("POST"),eq("/recover"),anyMap(),isNull())).thenThrow(new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE));
        assertEquals(ErrorCode.DEPENDENCY_UNAVAILABLE,assertThrows(BusinessException.class,()->service.recover("unknown@example.com")).getErrorCode());
    }
    @Test void resetExchangesRecoveryProofAndRevokesAllSessions(){
        var id=UUID.randomUUID();var json=new JsonMapper();
        when(remote.call(eq("POST"),eq("/verify"),eq(Map.of("type","recovery","token_hash","proof")),isNull())).thenReturn(json.createObjectNode().put("access_token","verified").put("refresh_token","refresh"));
        when(decoder.decode("verified")).thenReturn(Jwt.withTokenValue("verified").header("alg","RS256").subject(id.toString())
            .claim("email","person@example.com").claim("session_id",UUID.randomUUID().toString()).issuedAt(now).expiresAt(now.plusSeconds(300)).build());
        service.reset("proof","new secure password");
        var order=inOrder(remote,sessions);
        order.verify(remote).call("POST","/verify",Map.of("type","recovery","token_hash","proof"),null);
        order.verify(remote).call("PUT","/user",Map.of("password","new secure password"),"verified");
        order.verify(sessions).revokeAllForUser(id,now);
        order.verify(remote).call("POST","/logout?scope=global",Map.of(),"verified");
    }
    @Test void invalidProofNeverChangesPassword(){
        when(remote.call(eq("POST"),eq("/verify"),anyMap(),isNull())).thenThrow(new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        assertThrows(BusinessException.class,()->service.reset("used-proof","new secure password"));
        verify(remote,never()).call(eq("PUT"),anyString(),anyMap(),anyString());verifyNoInteractions(sessions);
    }
}
