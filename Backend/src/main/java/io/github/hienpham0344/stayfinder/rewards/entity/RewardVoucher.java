package io.github.hienpham0344.stayfinder.rewards.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "reward_vouchers") @Getter @Setter @NoArgsConstructor
public class RewardVoucher {
    public enum Status { AVAILABLE, RESERVED, USED }
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "catalog_id", nullable = false) private UUID catalogId;
    @Column(name = "points_cost", nullable = false) private int pointsCost;
    @Column(name = "discount_amount", nullable = false, precision = 19, scale = 0) private BigDecimal discountAmount;
    @Column(name = "min_spend", nullable = false, precision = 19, scale = 0) private BigDecimal minSpend;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Enumerated(EnumType.STRING) @Column(length = 16, nullable = false) private Status status = Status.AVAILABLE;
    @Column(name = "booking_id") private UUID bookingId;
    @Column(name = "reserved_until") private Instant reservedUntil;
    @Version private long version;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
}
