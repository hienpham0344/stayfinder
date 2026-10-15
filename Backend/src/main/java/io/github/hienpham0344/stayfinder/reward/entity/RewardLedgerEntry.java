package io.github.hienpham0344.stayfinder.reward.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="reward_ledger_entries",uniqueConstraints=@UniqueConstraint(name="uq_reward_ledger_source",columnNames={"user_id","source_key"})) @Getter @Setter @NoArgsConstructor
public class RewardLedgerEntry {
 @Id private UUID id;
 @Column(name="user_id",nullable=false) private UUID userId;
 @Column(nullable=false,length=32) private String kind;
 @Column(name="delta_points",nullable=false) private long deltaPoints;
 @Column(name="source_type",nullable=false,length=32) private String sourceType;
 @Column(name="source_id",nullable=false) private UUID sourceId;
 @Column(name="source_key",nullable=false,length=128) private String sourceKey;
 @Column(name="balance_after",nullable=false) private long balanceAfter;
 @Column(name="basis_usd_cents") private Long basisUsdCents;
 @Column(name="created_at",nullable=false) private Instant createdAt;
 @Column(nullable=false,length=160) private String title;
}
