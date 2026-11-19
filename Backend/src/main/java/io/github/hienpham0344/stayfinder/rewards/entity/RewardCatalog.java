package io.github.hienpham0344.stayfinder.rewards.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "reward_catalog") @Getter @Setter @NoArgsConstructor
public class RewardCatalog {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(length = 120, nullable = false) private String name;
    @Column(name = "points_cost", nullable = false) private int pointsCost;
    @Column(name = "discount_amount", nullable = false, precision = 19, scale = 0) private BigDecimal discountAmount;
    @Column(name = "min_spend", nullable = false, precision = 19, scale = 0) private BigDecimal minSpend;
    @Column(name = "validity_days", nullable = false) private int validityDays;
    private boolean enabled = true;
    @Version private long version;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
}
