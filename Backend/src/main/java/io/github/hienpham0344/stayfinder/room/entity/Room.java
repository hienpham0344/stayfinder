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
    @Column(name = "created_at") private Instant createdAt;
}
