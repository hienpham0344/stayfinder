package io.github.hienpham0344.stayfinder.room.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity @Table(name = "room_type") @Getter @Setter @NoArgsConstructor
public class RoomType {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    private String name;
}
