package io.github.hienpham0344.stayfinder.payment.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="payment_anomalies", uniqueConstraints=@UniqueConstraint(columnNames={"transaction_id","payment_id","reason"}))
@Getter @Setter @NoArgsConstructor
public class PaymentAnomaly {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(name="payment_id") private UUID paymentId;
    @Column(name="booking_id") private UUID bookingId;
    @Column(name="transaction_id",length=100) private String transactionId;
    @Column(length=64,nullable=false) private String reason;
    @Column(precision=19,scale=0) private BigDecimal amount;
    @Column(name="created_at",nullable=false) private Instant createdAt;
}
