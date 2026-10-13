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
    @Id private UUID id;
    @Column(name = "user_id") private UUID userId;
    @Column(name = "promotion_id") private UUID promotionId;
    @Column(name = "total_price") private BigDecimal totalPrice;
    @Convert(converter = BookingStatusConverter.class) private BookingStatus status;
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "paid_at") private Instant paidAt;
    @Column(name="quote_id") private UUID quoteId;
    @Column(name="confirmation_code") private String confirmationCode;
    @Column(name="total_price_cents") private Long totalPriceCents;
    @Column(name="hold_expires_at") private Instant holdExpiresAt;
    @Column(name="payment_method") private String paymentMethod;
    @Column(name="guest_full_name") private String guestFullName;
    @Column(name="guest_email") private String guestEmail;
    @Column(name="guest_phone") private String guestPhone;
    @Column(name="guest_special_request") private String guestSpecialRequest;
    @Column(name="cancellation_reason") private String cancellationReason;
    @Column(name="cancelled_at") private Instant cancelledAt;
    @Column(name="completed_at") private Instant completedAt;
    @Column(name="payment_status") private String paymentStatus;
    @Column(name="refund_status") private String refundStatus;
}
