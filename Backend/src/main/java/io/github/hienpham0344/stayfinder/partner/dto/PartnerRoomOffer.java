package io.github.hienpham0344.stayfinder.partner.dto;

import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PartnerRoomOffer(@NotNull @Min(0) @Max(9_007_199_254_740_991L) Long nightlyPriceCents,
                               @NotNull RoomStatus status) {
}
