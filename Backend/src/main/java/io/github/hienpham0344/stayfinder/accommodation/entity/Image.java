package io.github.hienpham0344.stayfinder.accommodation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity @Table(name = "images") @Getter @Setter @NoArgsConstructor
public class Image {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "accommodation_id") private UUID accommodationId;
    private String url;
}
