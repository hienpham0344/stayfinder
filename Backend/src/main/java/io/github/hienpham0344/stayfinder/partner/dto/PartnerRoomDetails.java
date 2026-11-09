package io.github.hienpham0344.stayfinder.partner.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PartnerRoomDetails(
        UUID roomTypeId,
        @NotBlank @Size(max = 160) String name,
        @Size(max = 4000) String description,
        @NotNull @Min(1) @Max(100) Integer maxGuestsPerRoom,
        @NotNull @Min(0) @Max(1000) Integer stockTotal,
        @DecimalMin(value = "0", inclusive = false) @Digits(integer = 5, fraction = 2) BigDecimal sizeSqm,
        @Size(max = 120) String bedType,
        @NotNull Boolean includesBreakfast,
        @NotNull @Size(max = 20) List<@NotBlank @Size(max = 1000)
                @Pattern(regexp = "(?i)https://[^\\s]+") String> imageUrls) {
}
