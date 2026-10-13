package io.github.hienpham0344.stayfinder.booking.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.room.dto.CancellationPolicyResponse;
import java.time.*;
import java.util.UUID;
public record QuoteResponse(UUID id,UUID accommodationId,UUID roomId,LocalDate checkIn,LocalDate checkOut,
 int quantity,int adults,int children,UUID voucherId,long rewardPoints,Instant expiresAt,int nights,long priceVersion,
 MoneyUsd nightlyPrice,MoneyUsd roomSubtotal,MoneyUsd cleaningFee,MoneyUsd serviceFee,MoneyUsd tax,MoneyUsd discount,MoneyUsd total,
 String discountSource,CancellationPolicyResponse cancellationPolicy) {}
