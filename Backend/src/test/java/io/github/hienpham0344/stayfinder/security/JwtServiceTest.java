package io.github.hienpham0344.stayfinder.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {
    private static final String SECRET = Base64.getEncoder().encodeToString(
            "stayfinder-test-secret-with-at-least-256-bits-123456".getBytes(StandardCharsets.UTF_8));

    @Test
    void createsAndParsesTokensWithTheRequiredIdentityClaims() {
        JwtService service = new JwtService(SECRET, 60);
        UUID userId = UUID.randomUUID();

        String token = service.generateToken(userId, "hien@example.com", UserRole.CUSTOMER);
        Jwt jwt = service.parseToken(token);

        assertEquals(userId.toString(), jwt.getSubject());
        assertEquals("hien@example.com", jwt.getClaimAsString("username"));
        assertEquals("customer", jwt.getClaimAsString("role"));
        assertTrue(service.isValid(token));
    }

    @Test
    void rejectsTamperedAndExpiredTokens() {
        JwtService service = new JwtService(SECRET, 60);
        String token = service.generateToken(UUID.randomUUID(), "hien@example.com", UserRole.CUSTOMER);

        assertFalse(service.isValid(token + "tampered"));
        Instant expiredAt = Instant.now().minusSeconds(60);
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(
                new SecretKeySpec(Base64.getDecoder().decode(SECRET), "HmacSHA256")));
        String expiredToken = encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                JwtClaimsSet.builder().subject(UUID.randomUUID().toString())
                        .issuedAt(expiredAt.minusSeconds(60)).expiresAt(expiredAt).build())).getTokenValue();
        assertFalse(new JwtService(SECRET, 60).isValid(expiredToken));
    }

    @Test
    void rejectsSecretsShorterThan256Bits() {
        String shortSecret = Base64.getEncoder().encodeToString("too-short".getBytes(StandardCharsets.UTF_8));

        assertThrows(IllegalArgumentException.class, () -> new JwtService(shortSecret, 60));
    }
}
