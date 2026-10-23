package io.github.hienpham0344.stayfinder.reward.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="reward_claims") @Getter @Setter @NoArgsConstructor
public class RewardClaim {
 @Id private UUID id;
 @Column(name="user_id",nullable=false) private UUID userId;
 @Column(name="offer_id",nullable=false) private UUID offerId;
 @Column(nullable=false,length=32) private String status;
 @Column(name="created_at",nullable=false) private Instant createdAt;
 @Column(name="expires_at",nullable=false) private Instant expiresAt;
 @Column(name="offer_code",nullable=false,length=40) private String offerCode;
 @Column(name="offer_title",nullable=false,length=160) private String offerTitle;
 @Column(nullable=false,length=32) private String kind;
 @Column(name="points_cost",nullable=false) private long pointsCost;
 @Column(name="validity_days",nullable=false) private int validityDays;
 @Column(name="discount_percent") private Integer discountPercent;
 @Column(name="discount_cap_cents") private Long discountCapCents;
 @Column(name="minimum_room_subtotal_cents") private Long minimumRoomSubtotalCents;
 @Column(name="benefit_value_cents") private Long benefitValueCents;
 @Column(name="fulfilment_description",nullable=false,columnDefinition="text") private String fulfilmentDescription;
}
