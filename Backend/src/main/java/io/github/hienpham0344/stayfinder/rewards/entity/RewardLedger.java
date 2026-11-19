package io.github.hienpham0344.stayfinder.rewards.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "reward_ledger", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "idempotency_key"}))
@org.hibernate.annotations.Immutable
@Getter @Setter @NoArgsConstructor
public class RewardLedger {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    private long delta;
    @Column(name = "balance_after", nullable = false) private int balanceAfter;
    @Column(name = "source_type", length = 24, nullable = false) private String sourceType;
    @Column(name = "source_id", nullable = false) private UUID sourceId;
    @Column(name = "idempotency_key", length = 128, nullable = false) private String idempotencyKey;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
}
