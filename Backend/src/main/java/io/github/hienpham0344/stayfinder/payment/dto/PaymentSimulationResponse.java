package io.github.hienpham0344.stayfinder.payment.dto;

import java.time.Instant;
import java.util.UUID;

/** Immutable attempt snapshot; current booking/payment state is read from their normal APIs. */
public record PaymentSimulationResponse(UUID id, UUID bookingId, UUID paymentId,
        SimulationOutcome outcome, String paymentStatus, Instant createdAt, boolean isDemo) {}
