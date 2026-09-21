package io.github.hienpham0344.stayfinder.payment.dto;

import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(UUID id, UUID bookingId, UUID paymentMethodId, BigDecimal amount,
                              String transactionId, PaymentStatus status, Instant createdAt) {
}
