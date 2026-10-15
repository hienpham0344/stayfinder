package io.github.hienpham0344.stayfinder.snapshot.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;
import java.math.BigDecimal;
@Entity @Table(name="room_snapshot") @Getter @Setter @NoArgsConstructor
public class RoomSnapshot {
 @Id private UUID id;
 @Column(name="room_id") private UUID roomId;
 @Column(name="source_room_id") private UUID sourceRoomId;
 private String name;
 private String description;
 private BigDecimal price;
 @Column(name="nightly_price_cents") private Long nightlyPriceCents;
 private String currency;
 @Column(name="max_guests_per_room") private Integer maxGuestsPerRoom;
 @Column(name="size_sqm") private BigDecimal sizeSqm;
 @Column(name="bed_type") private String bedType;
 @Column(name="includes_breakfast") private Boolean includesBreakfast;
 @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.ARRAY) @Column(name="image_urls") private String[] imageUrls;
 @Column(name="captured_at") private Instant capturedAt;
}
