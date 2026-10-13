package io.github.hienpham0344.stayfinder.security;
import org.junit.jupiter.api.Test;import org.springframework.security.oauth2.jwt.*;import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import com.nimbusds.jose.jwk.source.ImmutableSecret;import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;import java.time.*;import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class AccessTokenLifetimeTest {
 final byte[] secret="01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
 final Instant now=Instant.parse("2026-10-13T12:00:00Z");
 final JwtTokenProvider provider=new JwtTokenProvider(Base64.getEncoder().encodeToString(secret),Clock.fixed(now,ZoneOffset.UTC));
 JwtClaimsSet.Builder claims(){return JwtClaimsSet.builder().issuer(JwtTokenProvider.ISSUER).audience(List.of(JwtTokenProvider.AUDIENCE)).subject(UUID.randomUUID().toString()).claim("sid",UUID.randomUUID().toString()).id(UUID.randomUUID().toString());}
 String sign(JwtClaimsSet claims){
  return new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(secret,"HmacSHA256"))).encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),claims)).getTokenValue();
 }
 @Test void missingExpiryIssueOrNotBeforeClaimCannotMakeAnUnboundedAccessToken(){
  var missing=List.of(claims().issuedAt(now).notBefore(now).build(),claims().notBefore(now).expiresAt(now.plusSeconds(900)).build(),claims().issuedAt(now).expiresAt(now.plusSeconds(900)).build());
  for(var c:missing)assertThrows(JwtException.class,()->provider.decode(sign(c)));
 }
 @Test void lifetimeOverFifteenMinutesOrFutureIssueTimeIsRejected(){
  assertThrows(JwtException.class,()->provider.decode(sign(claims().issuedAt(now).notBefore(now).expiresAt(now.plusSeconds(3600)).build())));
  assertThrows(JwtException.class,()->provider.decode(sign(claims().issuedAt(now.plusSeconds(60)).notBefore(now).expiresAt(now.plusSeconds(900)).build())));
  assertDoesNotThrow(()->provider.decode(provider.issue(UUID.randomUUID(),UUID.randomUUID())));
 }
}
