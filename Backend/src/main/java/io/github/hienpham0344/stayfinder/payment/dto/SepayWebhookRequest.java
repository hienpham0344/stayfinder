package io.github.hienpham0344.stayfinder.payment.dto;

import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record SepayWebhookRequest(UUID bookingId, String transactionId, BigDecimal amount,
                                  PaymentStatus status, String signature) {
}
