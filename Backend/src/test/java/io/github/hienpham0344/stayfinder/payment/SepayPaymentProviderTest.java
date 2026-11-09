package io.github.hienpham0344.stayfinder.payment;

import io.github.hienpham0344.stayfinder.payment.service.SepayPaymentProvider;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SepayPaymentProviderTest {
    @Test
    void verifiesOfficialTimestampAndRawBodySignature() throws Exception {
        String secret = "test-secret";
        byte[] body = "{\"id\":123,\"transferAmount\":100000}".getBytes(StandardCharsets.UTF_8);
        String timestamp = Long.toString(Instant.now().getEpochSecond());
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = "sha256=" + HexFormat.of().formatHex(
                mac.doFinal((timestamp + "." + new String(body, StandardCharsets.UTF_8))
                        .getBytes(StandardCharsets.UTF_8)));
        SepayPaymentProvider provider = new SepayPaymentProvider(secret);

        assertTrue(provider.verifySignedWebhook(body, timestamp, signature));
        assertFalse(provider.verifySignedWebhook("{}".getBytes(StandardCharsets.UTF_8), timestamp, signature));
        assertFalse(provider.verifySignedWebhook(body, Long.toString(Instant.now().minusSeconds(301).getEpochSecond()), signature));
    }
}
