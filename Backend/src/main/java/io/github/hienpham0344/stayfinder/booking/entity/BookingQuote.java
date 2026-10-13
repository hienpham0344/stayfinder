package io.github.hienpham0344.stayfinder.booking.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;
import java.math.BigDecimal;
@Entity @Table(name="booking_quotes") @Getter @Setter @NoArgsConstructor
public class BookingQuote {
 @Id private UUID id;
 @Column(name="user_id") private UUID userId;
 @Column(name="accommodation_id") private UUID accommodationId;
 @Column(name="room_id") private UUID roomId;
 @Column(name="check_in") private LocalDate checkIn;
 @Column(name="check_out") private LocalDate checkOut;
 private int quantity;
 private int adults;
 private int children;
 @Column(name="voucher_id") private UUID voucherId;
 @Column(name="reward_points") private int rewardPoints;
 @Column(name="reserved_points") private long reservedPoints;
 @Column(name="discount_source") private String discountSource;
 private int nights;
 @Column(name="price_version") private long priceVersion;
 @Column(name="nightly_price_cents") private long nightlyPriceCents;
 @Column(name="room_subtotal_cents") private long roomSubtotalCents;
 @Column(name="cleaning_fee_cents") private long cleaningFeeCents;
 @Column(name="service_fee_cents") private long serviceFeeCents;
 @Column(name="tax_cents") private long taxCents;
 @Column(name="discount_cents") private long discountCents;
 @Column(name="total_cents") private long totalCents;
 private String timezone;
 @Column(name="max_guests_per_room") private int maxGuestsPerRoom;
 @Column(name="created_at") private Instant createdAt;
 @Column(name="expires_at") private Instant expiresAt;
 @Column(name="consumed_booking_id") private UUID consumedBookingId;
}
