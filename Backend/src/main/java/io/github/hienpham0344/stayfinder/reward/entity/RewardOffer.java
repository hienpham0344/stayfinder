package io.github.hienpham0344.stayfinder.reward.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="reward_offers") @Getter @Setter @NoArgsConstructor
public class RewardOffer {
 @Id private UUID id;
 @Column(nullable=false,unique=true,length=40) private String code;
 @Column(nullable=false,length=160) private String title;
 @Column(nullable=false,length=32) private String kind;
 @Column(name="points_cost",nullable=false) private long pointsCost;
 @Column(nullable=false) private boolean active;
 @Column(name="valid_from") private Instant validFrom;
 @Column(name="valid_until") private Instant validUntil;
 @Column(name="validity_days",nullable=false) private int validityDays;
 @Column(name="discount_percent") private Integer discountPercent;
 @Column(name="discount_cap_cents") private Long discountCapCents;
 @Column(name="minimum_room_subtotal_cents") private Long minimumRoomSubtotalCents;
 @Column(name="benefit_value_cents") private Long benefitValueCents;
 @Column(name="fulfilment_description",nullable=false,columnDefinition="text") private String fulfilmentDescription;
}
