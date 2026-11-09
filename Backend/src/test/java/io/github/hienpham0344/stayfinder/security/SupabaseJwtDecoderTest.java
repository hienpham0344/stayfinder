package io.github.hienpham0344.stayfinder.security;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.*;
import org.junit.jupiter.api.*;
import org.springframework.security.oauth2.jwt.*;
import java.security.*;
import java.security.interfaces.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class SupabaseJwtDecoderTest {
    private KeyPair keys;private SupabaseJwtDecoder decoder;
    private final Instant now=Instant.parse("2026-11-09T00:00:00Z");
    @BeforeEach void setup()throws Exception{
        var generator=KeyPairGenerator.getInstance("RSA");generator.initialize(2048);keys=generator.generateKeyPair();
        decoder=new SupabaseJwtDecoder(NimbusJwtDecoder.withPublicKey((RSAPublicKey)keys.getPublic()).build(),"https://project.supabase.co/auth/v1",Clock.fixed(now,ZoneOffset.UTC));
    }
    private String token(String issuer,String audience,Instant expiry,boolean session)throws Exception{
        var claims=new JWTClaimsSet.Builder().issuer(issuer).audience(audience).subject(UUID.randomUUID().toString())
            .issueTime(Date.from(now.minusSeconds(30))).expirationTime(Date.from(expiry));
        if(session)claims.claim("session_id",UUID.randomUUID().toString());
        var signed=new SignedJWT(new JWSHeader(JWSAlgorithm.RS256),claims.build());signed.sign(new RSASSASigner((RSAPrivateKey)keys.getPrivate()));return signed.serialize();
    }
    @Test void acceptsSignedProjectToken()throws Exception{assertNotNull(decoder.decode(token("https://project.supabase.co/auth/v1","authenticated",now.plusSeconds(300),true)));}
    @Test void rejectsOtherIssuer()throws Exception{String t=token("https://other.supabase.co/auth/v1","authenticated",now.plusSeconds(300),true);assertThrows(JwtException.class,()->decoder.decode(t));}
    @Test void rejectsWrongAudience()throws Exception{String t=token("https://project.supabase.co/auth/v1","anon",now.plusSeconds(300),true);assertThrows(JwtException.class,()->decoder.decode(t));}
    @Test void rejectsExpiredToken()throws Exception{String t=token("https://project.supabase.co/auth/v1","authenticated",now.minusSeconds(1),true);assertThrows(JwtException.class,()->decoder.decode(t));}
    @Test void rejectsMissingSession()throws Exception{String t=token("https://project.supabase.co/auth/v1","authenticated",now.plusSeconds(300),false);assertThrows(JwtException.class,()->decoder.decode(t));}
    @Test void rejectsDifferentSigningKey()throws Exception{String t=token("https://project.supabase.co/auth/v1","authenticated",now.plusSeconds(300),true);setup();assertThrows(JwtException.class,()->decoder.decode(t));}
    @Test void startupDoesNotFetchJwks(){assertDoesNotThrow(()->new SupabaseJwtDecoder("https://offline.invalid",Clock.fixed(now,ZoneOffset.UTC)));}
    @Test void rejectsInsecureOrAmbiguousProjectUrl(){for(String url:List.of("http://example.com","https://example.com/path","https://user@example.com","https://example.com?x=y"))assertThrows(IllegalArgumentException.class,()->SupabaseJwtDecoder.validatedUrl(url));}
}
