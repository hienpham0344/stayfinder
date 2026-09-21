package io.github.hienpham0344.stayfinder.booking.entity;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "booking_details") @Getter @Setter @NoArgsConstructor
public class BookingDetail {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "booking_id") private UUID bookingId;
    @Column(name = "room_snapshot_id") private UUID roomSnapshotId;
    @Column(name = "accommodation_snapshot_id") private UUID accommodationSnapshotId;
    @Column(name = "check_in_date") private LocalDate checkInDate;
    @Column(name = "check_out_date") private LocalDate checkOutDate;
    private Integer quantity;
    private BigDecimal subtotal;
}
