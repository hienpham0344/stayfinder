package io.github.hienpham0344.stayfinder.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import javax.crypto.spec.SecretKeySpec;
import java.lang.reflect.InvocationTargetException;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class TokenProviderTest {
    private static final Instant NOW=Instant.parse("2026-10-12T12:00:00Z");
    private static final String SECRET=Base64.getEncoder().encodeToString(
            "stayfinder-unit-test-only-signing-secret-256-bits".getBytes(StandardCharsets.UTF_8));
    private Object provider(String secret) throws Throwable {
        try { return Class.forName("io.github.hienpham0344.stayfinder.security.JwtTokenProvider")
                .getConstructor(String.class,Clock.class).newInstance(secret,Clock.fixed(NOW,ZoneOffset.UTC)); }
        catch(ClassNotFoundException ex){return fail("The Spring-owned session JWT provider is missing");}
        catch(InvocationTargetException ex){throw ex.getCause();}
    }
    private Object call(Object target,String name,Class<?>[] types,Object...args) throws Throwable {
        try{return target.getClass().getMethod(name,types).invoke(target,args);}
        catch(InvocationTargetException ex){throw ex.getCause();}
    }
    private String issue(Object p,UUID user,UUID session) throws Throwable {
        return (String)call(p,"issue",new Class<?>[]{UUID.class,UUID.class},user,session);
    }
    private Jwt decode(Object p,String token) throws Throwable {
        return (Jwt)call(p,"decode",new Class<?>[]{String.class},token);
    }
    private String signed(String issuer,String audience,Instant expiry,Instant notBefore) {
        JwtEncoder encoder=new NimbusJwtEncoder(new ImmutableSecret<>(
                new SecretKeySpec(Base64.getDecoder().decode(SECRET),"HmacSHA256")));
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),
                JwtClaimsSet.builder().issuer(issuer).audience(List.of(audience))
                        .subject(UUID.randomUUID().toString()).claim("sid",UUID.randomUUID().toString())
                        .id(UUID.randomUUID().toString()).issuedAt(NOW.minusSeconds(60))
                        .notBefore(notBefore).expiresAt(expiry).build())).getTokenValue();
    }
    @Test void issuesBoundedSessionIdentityWithoutTrustingRoleOrPublishingEmail() throws Throwable {
        Object p=provider(SECRET); UUID user=UUID.randomUUID(),session=UUID.randomUUID();
        Jwt jwt=decode(p,issue(p,user,session));
        assertEquals(user.toString(),jwt.getSubject());
        assertEquals(session.toString(),jwt.getClaimAsString("sid"));
        assertEquals("stayfinder-api",jwt.getClaimAsString("iss"));
        assertEquals(List.of("stayfinder-user"),jwt.getAudience());
        assertEquals(NOW.plusSeconds(900),jwt.getExpiresAt());
        assertNotNull(jwt.getId()); assertNull(jwt.getClaim("role")); assertNull(jwt.getClaim("email"));
    }
    @Test void rejectsForeignIssuerEvenWithCorrectKey() throws Throwable {
        Object p=provider(SECRET);
        assertThrows(JwtException.class,()->decode(p,signed("foreign","stayfinder-user",NOW.plusSeconds(600),NOW)));
    }
    @Test void rejectsForeignAudienceEvenWithCorrectKey() throws Throwable {
        Object p=provider(SECRET);
        assertThrows(JwtException.class,()->decode(p,signed("stayfinder-api","foreign",NOW.plusSeconds(600),NOW)));
    }
    @Test void rejectsExpiredAndNotYetValidTokensUsingInjectedClock() throws Throwable {
        Object p=provider(SECRET);
        assertThrows(JwtException.class,()->decode(p,signed("stayfinder-api","stayfinder-user",NOW.minusSeconds(1),NOW.minusSeconds(60))));
        assertThrows(JwtException.class,()->decode(p,signed("stayfinder-api","stayfinder-user",NOW.plusSeconds(600),NOW.plusSeconds(1))));
    }
    @Test void rejectsTamperedSignature() throws Throwable {
        Object p=provider(SECRET);
        assertThrows(JwtException.class,()->decode(p,issue(p,UUID.randomUUID(),UUID.randomUUID())+"tampered"));
    }
    @Test void rejectsShortOrMalformedSigningSecret() {
        assertThrows(IllegalArgumentException.class,()->provider(Base64.getEncoder().encodeToString(new byte[8])));
        assertThrows(IllegalArgumentException.class,()->provider("not-base64"));
    }
}
