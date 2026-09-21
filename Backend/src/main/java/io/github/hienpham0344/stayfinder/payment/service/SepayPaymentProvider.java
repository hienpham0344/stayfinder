package io.github.hienpham0344.stayfinder.payment.service;

import io.github.hienpham0344.stayfinder.payment.dto.SepayWebhookRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class SepayPaymentProvider implements PaymentProvider {
    private final String webhookSecret;

    public SepayPaymentProvider(@Value("${SEPAY_WEBHOOK_SECRET:}") String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    @Override
    public boolean verifyWebhook(SepayWebhookRequest request) {
        if (webhookSecret.isBlank() || request == null || request.signature() == null
                || request.transactionId() == null || request.bookingId() == null || request.amount() == null
                || request.status() == null) {
            return false;
        }
        String canonical = request.transactionId() + "|" + request.bookingId() + "|"
                + request.amount().toPlainString() + "|" + request.status().getValue();
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8));
            byte[] provided = java.util.HexFormat.of().parseHex(request.signature());
            return MessageDigest.isEqual(expected, provided);
        } catch (Exception exception) {
            return false;
        }
    }
}
