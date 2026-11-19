package io.github.hienpham0344.stayfinder.rewards.dto;

import io.github.hienpham0344.stayfinder.rewards.entity.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class RewardDtos {
    private RewardDtos() { }
    public record Account(int points, String currency, long earnVndPerPoint) { }
    public record Redeem(@NotNull UUID catalogId, @NotNull UUID idempotencyKey) { }
    public record CatalogRequest(@NotBlank @Size(max = 120) String name, @Min(1) int pointsCost,
                                 @NotNull @DecimalMin("1") @Digits(integer = 18, fraction = 0) BigDecimal discountAmount,
                                 @NotNull @DecimalMin("1") @Digits(integer = 18, fraction = 0) BigDecimal minSpend,
                                 @Min(1) @Max(365) int validityDays, boolean enabled, @Min(0) long version) { }
    public record Catalog(UUID id, String name, int pointsCost, BigDecimal discountAmount,
                          BigDecimal minSpend, int validityDays, boolean enabled, long version) {
        public static Catalog from(RewardCatalog c) { return new Catalog(c.getId(), c.getName(), c.getPointsCost(),
                c.getDiscountAmount(), c.getMinSpend(), c.getValidityDays(), c.isEnabled(), c.getVersion()); }
    }
    public record Voucher(UUID id, UUID catalogId, int pointsCost, BigDecimal discountAmount, BigDecimal minSpend,
                          Instant expiresAt, String status, UUID bookingId, Instant reservedUntil) {
        public static Voucher from(RewardVoucher v) { return new Voucher(v.getId(), v.getCatalogId(), v.getPointsCost(),
                v.getDiscountAmount(), v.getMinSpend(), v.getExpiresAt(), v.getStatus().name(), v.getBookingId(), v.getReservedUntil()); }
    }
    public record Ledger(UUID id, long delta, int balanceAfter, String sourceType, UUID sourceId, Instant createdAt) {
        public static Ledger from(RewardLedger l) { return new Ledger(l.getId(), l.getDelta(), l.getBalanceAfter(),
                l.getSourceType(), l.getSourceId(), l.getCreatedAt()); }
    }
    public record Discount(UUID voucherId, BigDecimal amount, String policy) {
        public static Discount none() { return new Discount(null, BigDecimal.ZERO, null); }
    }
}
