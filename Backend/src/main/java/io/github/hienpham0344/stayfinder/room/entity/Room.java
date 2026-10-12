package io.github.hienpham0344.stayfinder.room.entity;

import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatusConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "room") @Getter @Setter @NoArgsConstructor
public class Room {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "accommodation_id") private UUID accommodationId;
    @Column(name = "room_type_id") private UUID roomTypeId;
    private String name;
    private BigDecimal price;
    private String description;
    @Convert(converter = RoomStatusConverter.class) private RoomStatus status;
    @Column(name="nightly_price_cents") private Long nightlyPriceCents;
    @Column(name="max_guests_per_room") private Integer maxGuestsPerRoom;
    @Column(name="stock_total") private Integer stockTotal;
    @Column(name="size_sqm") private BigDecimal sizeSqm;
    @Column(name="bed_type") private String bedType;
    @Column(name="includes_breakfast") private Boolean includesBreakfast;
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.ARRAY)
    @Column(name="image_urls") private String[] imageUrls;
    @Column(name = "created_at") private Instant createdAt;
}
