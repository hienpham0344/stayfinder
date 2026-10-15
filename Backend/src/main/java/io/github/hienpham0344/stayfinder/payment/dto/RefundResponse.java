package io.github.hienpham0344.stayfinder.payment.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;import java.time.Instant;import java.util.UUID;
public record RefundResponse(UUID id,UUID bookingId,UUID paymentId,String status,MoneyUsd originalAmount,Long settlementVnd,String usdToVndRate,String rateVersion,Instant requestedAt,Instant confirmedAt,String reference){}
