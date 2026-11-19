package io.github.hienpham0344.stayfinder.management.dto;

import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class ManagementRequests {
    private ManagementRequests() { }

    public record PartnerApplicationRequest(@NotBlank @Size(max = 200) String businessName,
                                            @NotBlank @Size(max = 2000) String description) { }

    public record Decision(@NotNull Boolean approved, @NotBlank @Size(max = 1000) String reason,
                           @NotNull @PositiveOrZero Long version) { }

    public record AccountUpdate(@NotNull UserRole role, @NotNull Boolean enabled,
                                @NotBlank @Size(max = 1000) String reason,
                                @NotNull @PositiveOrZero Long version) { }

    public record AccommodationWrite(@NotBlank @Size(max = 200) String name,
                                     @NotBlank @Size(max = 255) String address,
                                     @Size(max = 10000) String description,
                                     @NotNull UUID typeId,
                                     @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
                                     @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude,
                                     @NotNull @Positive @Digits(integer = 16, fraction = 0) BigDecimal basePrice,
                                     @NotNull @Size(max = 20) List<@NotBlank @Size(max = 2000) String> imageUrls,
                                     @NotNull @Size(max = 30) List<@NotNull UUID> featureIds,
                                     @PositiveOrZero Long version) { }

    public record RoomWrite(@NotNull UUID roomTypeId, @NotBlank @Size(max = 200) String name,
                            @Size(max = 10000) String description,
                            @NotNull @Positive @Digits(integer = 16, fraction = 0) BigDecimal price,
                            @NotNull @Min(1) @Max(100) Integer capacity, @NotNull RoomStatus status,
                            @PositiveOrZero Long version) { }

    public record VersionRequest(@NotNull @PositiveOrZero Long version) { }

    public record AccommodationModeration(@NotNull AccommodationStatus status,
                                           @NotBlank @Size(max = 1000) String reason,
                                           @NotNull @PositiveOrZero Long version) { }

    public record ReviewModeration(@NotNull Boolean hidden, @NotBlank @Size(max = 1000) String reason,
                                    @NotNull @PositiveOrZero Long version) { }
}
