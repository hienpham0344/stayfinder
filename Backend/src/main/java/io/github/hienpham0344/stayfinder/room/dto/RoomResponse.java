package io.github.hienpham0344.stayfinder.room.dto;

import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record RoomResponse(UUID id, UUID accommodationId, UUID roomTypeId, String name,
                           BigDecimal price, String description, RoomStatus status) {
}
