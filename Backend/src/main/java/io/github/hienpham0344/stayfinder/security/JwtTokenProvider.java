package io.github.hienpham0344.stayfinder.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.*;
import java.util.*;

public final class JwtTokenProvider {
    public static final String ISSUER="stayfinder-api";
    public static final String AUDIENCE="stayfinder-user";
    private final JwtEncoder encoder;
    private final NimbusJwtDecoder decoder;
    private final Clock clock;
    public JwtTokenProvider(String secretBase64,Clock clock) {
        if(secretBase64==null||secretBase64.isBlank())throw new IllegalArgumentException("JWT secret must be configured");
        byte[] decoded=Base64.getDecoder().decode(secretBase64);
        if(decoded.length<32)throw new IllegalArgumentException("JWT signing secret needs at least 256 bits");
        this.clock=Objects.requireNonNull(clock);
        SecretKey key=new SecretKeySpec(decoded,"HmacSHA256");
        encoder=new NimbusJwtEncoder(new ImmutableSecret<>(key));
        decoder=NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        JwtTimestampValidator timestamps=new JwtTimestampValidator(Duration.ZERO); timestamps.setClock(clock);
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(timestamps,
                this::validateLifetime,
                new JwtIssuerValidator(ISSUER),
                new JwtClaimValidator<List<String>>("aud",v->v!=null&&v.contains(AUDIENCE)),
                new JwtClaimValidator<String>("sid",JwtTokenProvider::validUuid),
                new JwtClaimValidator<String>("sub",JwtTokenProvider::validUuid),
                new JwtClaimValidator<String>("jti",v->v!=null&&!v.isBlank())));
    }
    private org.springframework.security.oauth2.core.OAuth2TokenValidatorResult validateLifetime(Jwt token) {
        Instant issued=token.getIssuedAt(),notBefore=token.getNotBefore(),expires=token.getExpiresAt();
        boolean valid=issued!=null&&notBefore!=null&&expires!=null
            &&!issued.isAfter(clock.instant())&&!notBefore.isBefore(issued)&&notBefore.isBefore(expires)
            &&expires.isAfter(issued)&&Duration.between(issued,expires).compareTo(Duration.ofMinutes(15))<=0;
        return valid?org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success():
            org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(
                new org.springframework.security.oauth2.core.OAuth2Error("invalid_token","Invalid access token lifetime",null));
    }
    private static boolean validUuid(String value) {
        if(value==null)return false;
        try{return UUID.fromString(value).toString().equals(value);}catch(IllegalArgumentException exception){return false;}
    }
    public String issue(UUID userId,UUID sessionId) {
        Instant now=clock.instant();
        JwtClaimsSet claims=JwtClaimsSet.builder().issuer(ISSUER).audience(List.of(AUDIENCE))
                .subject(userId.toString()).claim("sid",sessionId.toString()).id(UUID.randomUUID().toString())
                .issuedAt(now).notBefore(now).expiresAt(now.plusSeconds(900)).build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),claims)).getTokenValue();
    }
    public Jwt decode(String token){return decoder.decode(token);}
    public JwtDecoder decoder(){return decoder;}
}
