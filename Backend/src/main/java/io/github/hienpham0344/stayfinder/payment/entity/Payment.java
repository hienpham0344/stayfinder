package io.github.hienpham0344.stayfinder.payment.entity;

import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatusConverter;
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

@Entity @Table(name = "payments") @Getter @Setter @NoArgsConstructor
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "booking_id") private UUID bookingId;
    @Column(name = "payment_method_id") private UUID paymentMethodId;
    private BigDecimal amount;
    @Column(name = "transaction_id") private String transactionId;
    @Convert(converter = PaymentStatusConverter.class) private PaymentStatus status;
    @Column(name = "created_at") private Instant createdAt;
}
