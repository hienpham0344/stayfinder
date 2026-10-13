package io.github.hienpham0344.stayfinder.snapshot.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;
import java.math.BigDecimal;
@Entity @Table(name="accommodation_snapshot") @Getter @Setter @NoArgsConstructor
public class AccommodationSnapshot {
 @Id private UUID id;
 @Column(name="accommodation_id") private UUID accommodationId;
 @Column(name="source_accommodation_id") private UUID sourceAccommodationId;
 private String name;
 private String address;
 private String timezone;
 @Column(name="cleaning_fee_cents") private Long cleaningFeeCents;
 @Column(name="service_fee_cents") private Long serviceFeeCents;
 @Column(name="image_url") private String imageUrl;
 @Column(name="captured_at") private Instant capturedAt;
}
