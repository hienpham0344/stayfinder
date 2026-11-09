package io.github.hienpham0344.stayfinder.payment.service;

import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.util.Locale;
import java.util.UUID;

public final class PaymentCode {
    private PaymentCode() {
    }

    public static String fromId(UUID paymentId) {
        if (paymentId == null) return null;
        byte[] bytes = ByteBuffer.allocate(16)
                .putLong(paymentId.getMostSignificantBits())
                .putLong(paymentId.getLeastSignificantBits()).array();
        String suffix = new BigInteger(1, bytes).toString(32).toUpperCase(Locale.ROOT);
        return "SF" + "0".repeat(26 - suffix.length()) + suffix;
    }

    public static UUID toId(String code) {
        if (code == null || !code.matches("SF[0-9A-V]{26}")) {
            throw new IllegalArgumentException("Invalid payment code");
        }
        BigInteger value = new BigInteger(code.substring(2), 32);
        if (value.bitLength() > 128) throw new IllegalArgumentException("Invalid payment code");
        byte[] encoded = value.toByteArray();
        byte[] bytes = new byte[16];
        System.arraycopy(encoded, Math.max(0, encoded.length - 16), bytes,
                Math.max(0, 16 - encoded.length), Math.min(encoded.length, 16));
        ByteBuffer buffer = ByteBuffer.wrap(bytes);
        return new UUID(buffer.getLong(), buffer.getLong());
    }
}
