package io.github.hienpham0344.stayfinder.security;
import io.github.hienpham0344.stayfinder.auth.entity.RefreshSession;
import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class SupabasePrincipalTest {
    UserRepository users=mock(UserRepository.class);RefreshSessionRepository sessions=mock(RefreshSessionRepository.class);
    Instant now=Instant.parse("2026-11-09T00:00:00Z");UUID uid=UUID.randomUUID(),sid=UUID.randomUUID();
    CurrentUserJwtConverter converter;User user;RefreshSession session;Jwt jwt;
    @BeforeEach void setup(){
        converter=new CurrentUserJwtConverter(users,sessions,Clock.fixed(now,ZoneOffset.UTC));ReflectionTestUtils.setField(converter,"mode","supabase");
        user=new User();user.setId(uid);user.setRole(UserRole.CUSTOMER);user.setCredentialState("active");
        session=new RefreshSession();session.setId(sid);session.setUserId(uid);session.setExpiresAt(now.plusSeconds(600));
        when(users.findById(uid)).thenReturn(Optional.of(user));when(sessions.findById(sid)).thenReturn(Optional.of(session));
        jwt=Jwt.withTokenValue("opaque").header("alg","RS256").subject(uid.toString()).claim("session_id",sid.toString()).claim("user_metadata",Map.of("role","ADMIN")).build();
    }
    @Test void ignoresClientMetadataAndDoesNotNeedLocalPassword(){assertEquals("ROLE_CUSTOMER",converter.convert(jwt).getAuthorities().iterator().next().getAuthority());}
    @Test void readsEachTrustedLocalRole(){for(UserRole role:UserRole.values()){user.setRole(role);assertEquals("ROLE_"+role.name(),converter.convert(jwt).getAuthorities().iterator().next().getAuthority());}}
    @Test void rejectsDisabledLocalAccount(){user.setCredentialState("disabled");assertThrows(BadCredentialsException.class,()->converter.convert(jwt));}
    @Test void rejectsRevokedLocalSession(){session.setRevokedAt(now);assertThrows(BadCredentialsException.class,()->converter.convert(jwt));}
    @Test void rejectsSessionOwnedByAnotherUser(){session.setUserId(UUID.randomUUID());assertThrows(BadCredentialsException.class,()->converter.convert(jwt));}
}
