package io.github.hienpham0344.stayfinder.booking.entity;

import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatusConverter;
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

@Entity @Table(name = "bookings") @Getter @Setter @NoArgsConstructor
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id") private UUID userId;
    @Column(name = "promotion_id") private UUID promotionId;
    @Column(name = "total_price") private BigDecimal totalPrice;
    @Convert(converter = BookingStatusConverter.class) private BookingStatus status;
    @Column(name = "created_at") private Instant createdAt;
}
