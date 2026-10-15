package io.github.hienpham0344.stayfinder.payment.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;
import java.math.BigDecimal;
@Entity @Table(name="refund_requests") @Getter @Setter @NoArgsConstructor
public class RefundRequest {
 @Id private UUID id;
 @Column(name="booking_id") private UUID bookingId;
 @Column(name="user_id") private UUID userId;
 @Column(name="payment_id") private UUID paymentId;
 @Column(name="amount_usd_cents") private long amountUsdCents;
 @Column(name="settlement_vnd") private Long settlementVnd;
 @Column(name="usd_to_vnd_rate") private String usdToVndRate;
 @Column(name="rate_version") private String rateVersion;
 private String status;
 @Column(name="requested_at") private Instant requestedAt;
 @Column(name="confirmed_at") private Instant confirmedAt;
 @Column(name="confirmed_by") private UUID confirmedBy;
 private String reference;
}
