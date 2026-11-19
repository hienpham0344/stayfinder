package io.github.hienpham0344.stayfinder.rewards.service;

import io.github.hienpham0344.stayfinder.rewards.dto.RewardDtos.Discount;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface BookingRewards {
    Discount reserve(UUID voucherId, UUID userId, UUID bookingId, BigDecimal subtotal, Instant bookingExpiresAt);
    void consume(UUID bookingId, UUID expectedVoucherId);
    void release(UUID bookingId);
    void earnCompleted(UUID userId, UUID bookingId, BigDecimal paidAmount);
}
