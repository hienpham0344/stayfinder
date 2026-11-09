package io.github.hienpham0344.stayfinder.room.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "room_snapshot")
@Getter @Setter @NoArgsConstructor
public class RoomSnapshot {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "room_id") private UUID roomId;
    private String name;
    private BigDecimal price;
    private String description;
}
