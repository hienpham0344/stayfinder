package io.github.hienpham0344.stayfinder.payment.dto;

import java.util.UUID;

public record CreatePaymentRequest(UUID paymentMethodId) {
}
