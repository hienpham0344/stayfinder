package io.github.hienpham0344.stayfinder.partner.dto;

import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public record PartnerRoomResponse(UUID id, UUID accommodationId, UUID roomTypeId, String name,
                                  String description, Long nightlyPriceCents, RoomStatus status,
                                  Integer maxGuestsPerRoom, Integer stockTotal, BigDecimal sizeSqm,
                                  String bedType, Boolean includesBreakfast, List<String> imageUrls) {
    public PartnerRoomResponse {
        imageUrls = imageUrls == null ? List.of() : imageUrls.stream().filter(Objects::nonNull).toList();
    }
}
