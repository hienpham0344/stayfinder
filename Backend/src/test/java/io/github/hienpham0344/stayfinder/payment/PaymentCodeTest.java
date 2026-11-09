package io.github.hienpham0344.stayfinder.payment;

import io.github.hienpham0344.stayfinder.payment.service.PaymentCode;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PaymentCodeTest {
    @Test
    void codeRoundTripsPaymentIdWithinSepaySuffixLimit() {
        UUID id = UUID.randomUUID();
        String code = PaymentCode.fromId(id);

        assertEquals(28, code.length());
        assertEquals(id, PaymentCode.toId(code));
    }

    @Test
    void rejectsMalformedCode() {
        assertThrows(IllegalArgumentException.class, () -> PaymentCode.toId("SF123"));
    }
}
