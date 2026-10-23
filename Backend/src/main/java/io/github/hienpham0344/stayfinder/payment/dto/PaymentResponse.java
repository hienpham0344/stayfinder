package io.github.hienpham0344.stayfinder.payment.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import java.time.Instant;import java.util.UUID;
public record PaymentResponse(UUID id,UUID bookingId,String method,String status,MoneyUsd originalAmount,Instant createdAt,Instant expiresAt,
 String reconciliationStatus,String refundStatus,BankTransferInstructions settlement){}
