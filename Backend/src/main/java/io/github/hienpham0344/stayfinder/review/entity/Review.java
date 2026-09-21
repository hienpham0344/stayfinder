package io.github.hienpham0344.stayfinder.review.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "reviews") @Getter @Setter @NoArgsConstructor
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id") private UUID userId;
    @Column(name = "booking_id") private UUID bookingId;
    @Column(name = "accommodation_id") private UUID accommodationId;
    private Integer rating;
    private String comment;
    @Column(name = "created_at") private Instant createdAt;
}
