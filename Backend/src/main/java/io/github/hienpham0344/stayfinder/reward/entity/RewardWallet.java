package io.github.hienpham0344.stayfinder.reward.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="reward_wallets") @Getter @Setter @NoArgsConstructor
public class RewardWallet {
 @Id @Column(name="user_id") private UUID userId;
 @Column(name="available_points",nullable=false) private long availablePoints;
 @Column(name="reserved_points",nullable=false) private long reservedPoints;
 @Column(name="lifetime_earned_points",nullable=false) private long lifetimeEarnedPoints;
}
