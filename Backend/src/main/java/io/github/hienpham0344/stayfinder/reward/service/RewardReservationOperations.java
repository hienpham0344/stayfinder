package io.github.hienpham0344.stayfinder.reward.service;
import java.time.Instant;
import java.util.UUID;
public interface RewardReservationOperations {
 RewardPolicy.DiscountPreview preview(UUID userId,long roomSubtotalCents,UUID voucherClaimId,long points,Instant now);
 void reserve(UUID userId,UUID quoteId,UUID bookingId,RewardPolicy.DiscountPreview preview);
 void consume(UUID bookingId);
 void release(UUID bookingId);
 void restoreAfterRefund(UUID bookingId);
 void earnOnce(UUID userId,UUID bookingId,long netCollectedUsdCents);
}
