package io.github.hienpham0344.stayfinder.payment.entity;

import io.github.hienpham0344.stayfinder.payment.dto.SimulationOutcome;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

/** Append-only evidence of a simulated result, separate from the collection ledger. */
@Entity
@Table(name = "payment_simulation_attempts")
@Getter @Setter @NoArgsConstructor
public class PaymentSimulationAttempt {
    @Id private UUID id;
    @Column(name = "user_id", nullable = false, updatable = false) private UUID userId;
    @Column(name = "booking_id", nullable = false, updatable = false) private UUID bookingId;
    @Column(name = "payment_id", nullable = false, updatable = false) private UUID paymentId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false) private SimulationOutcome outcome;
    @Column(name = "payment_status", nullable = false, updatable = false) private String paymentStatus;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
}
