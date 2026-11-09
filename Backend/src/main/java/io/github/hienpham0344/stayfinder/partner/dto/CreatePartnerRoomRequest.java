package io.github.hienpham0344.stayfinder.partner.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreatePartnerRoomRequest(@NotNull @Valid PartnerRoomDetails details,
                                       @NotNull @Valid PartnerRoomOffer offer) {
}
