package io.github.hienpham0344.stayfinder.partner.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PartnerAccommodationRequest(
        @NotNull UUID typeId,
        @NotNull UUID locationId,
        @NotBlank @Size(max = 160) String name,
        @NotBlank @Size(max = 240) String address,
        @Size(max = 4000) String description,
        @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
        @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude,
        @NotBlank @Size(max = 100) String timezone,
        @NotNull @Min(0) @Max(9_007_199_254_740_991L) Long cleaningFeeCents,
        @NotNull @Min(0) @Max(9_007_199_254_740_991L) Long serviceFeeCents,
        @Min(0) @Max(100) Integer bedrooms,
        @Min(0) @Max(100) Integer beds,
        @Min(0) @Max(100) Integer baths,
        @NotNull Boolean published,
        @NotNull @Size(max = 50) List<@NotNull UUID> amenityIds,
        @NotNull @Size(max = 20) List<@NotBlank @Size(max = 1000)
                @Pattern(regexp = "(?i)https://[^\\s]+") String> imageUrls) {
}
