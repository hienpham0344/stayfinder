package io.github.hienpham0344.stayfinder.payment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Arrays;
import java.util.HexFormat;

@Component
public class SepayPaymentProvider implements PaymentProvider {
    private final String webhookSecret;

    public SepayPaymentProvider(@Value("${SEPAY_WEBHOOK_SECRET:}") String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    @Override
    public boolean verifySignedWebhook(byte[] rawBody, String timestamp, String signature) {
        if (webhookSecret.isBlank() || rawBody == null || rawBody.length == 0
                || timestamp == null || signature == null || !signature.startsWith("sha256=")) {
            return false;
        }
        try {
            long sentAt = Long.parseLong(timestamp);
            long now = Instant.now().getEpochSecond();
            if (sentAt < now - 300 || sentAt > now + 300) return false;
            byte[] prefix = (timestamp + ".").getBytes(StandardCharsets.UTF_8);
            byte[] signed = Arrays.copyOf(prefix, prefix.length + rawBody.length);
            System.arraycopy(rawBody, 0, signed, prefix.length, rawBody.length);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return MessageDigest.isEqual(mac.doFinal(signed),
                    HexFormat.of().parseHex(signature.substring("sha256=".length())));
        } catch (Exception exception) {
            return false;
        }
    }
}
