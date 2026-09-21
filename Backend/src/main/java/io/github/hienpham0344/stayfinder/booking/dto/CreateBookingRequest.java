package io.github.hienpham0344.stayfinder.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateBookingRequest(@NotNull UUID accommodationId, @NotNull UUID roomId,
                                   @NotNull LocalDate checkIn, @NotNull LocalDate checkOut,
                                   @Min(1) int quantity, @Min(1) int guests) {
}
