package io.github.hienpham0344.stayfinder.common.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;
public record QuoteSelection(@NotNull UUID accommodationId,@NotNull UUID roomId,
        @NotNull LocalDate checkIn,@NotNull LocalDate checkOut,
        @Min(1) @Max(10) int quantity,@Min(1) @Max(20) int adults,@Min(0) @Max(20) int children) {}
