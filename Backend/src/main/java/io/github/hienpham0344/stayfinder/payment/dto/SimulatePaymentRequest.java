package io.github.hienpham0344.stayfinder.payment.dto;

import jakarta.validation.constraints.NotNull;

public record SimulatePaymentRequest(@NotNull SimulationOutcome outcome) {}
