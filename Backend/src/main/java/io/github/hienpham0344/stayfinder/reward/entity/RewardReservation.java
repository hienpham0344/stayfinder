package io.github.hienpham0344.stayfinder.reward.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="reward_reservations") @Getter @Setter @NoArgsConstructor
public class RewardReservation {
 @Id @Column(name="booking_id") private UUID bookingId;
 @Column(name="user_id",nullable=false) private UUID userId;
 @Column(name="quote_id",nullable=false) private UUID quoteId;
 @Column(name="voucher_claim_id") private UUID voucherClaimId;
 @Column(name="reserved_points",nullable=false) private long reservedPoints;
 @Column(name="discount_cents",nullable=false) private long discountCents;
 @Column(nullable=false,length=16) private String source;
 @Column(nullable=false,length=16) private String state;
 @Column(name="created_at",nullable=false) private Instant createdAt;
 @Column(name="processed_at") private Instant processedAt;
}
