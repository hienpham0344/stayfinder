package io.github.hienpham0344.stayfinder.booking.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;
public record CreateBookingRequest(@NotNull UUID accommodationId, @NotNull UUID roomId,
                                   @NotNull LocalDate checkIn, @NotNull LocalDate checkOut,
                                   @Min(1) @Max(1) int quantity, @Min(1) int guests, UUID voucherId) {
    public CreateBookingRequest(UUID accommodationId, UUID roomId, LocalDate checkIn, LocalDate checkOut, int quantity, int guests) {
        this(accommodationId, roomId, checkIn, checkOut, quantity, guests, null);
    }
}
