package io.github.hienpham0344.stayfinder.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jwt.JwtException;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

public class JwtService {
    private static final int MINIMUM_SECRET_BYTES = 32;

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final long expirationMinutes;

    public JwtService(String secretBase64, long expirationMinutes) {
        byte[] secret = decodeSecret(secretBase64);
        SecretKey key = new SecretKeySpec(secret, "HmacSHA256");
        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        this.decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(UUID userId, String username, UserRole role) {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("role", role.getValue())
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(expirationMinutes * 60))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public Jwt parseToken(String token) {
        return decoder.decode(token);
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }

    private static byte[] decodeSecret(String secretBase64) {
        if (secretBase64 == null || secretBase64.isBlank()) {
            throw new IllegalArgumentException("JWT secret must be configured");
        }
        final byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(secretBase64);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("JWT secret must be valid Base64", exception);
        }
        if (decoded.length < MINIMUM_SECRET_BYTES) {
            throw new IllegalArgumentException("JWT secret must contain at least 256 bits");
        }
        return decoded;
    }
}
