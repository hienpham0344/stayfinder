package io.github.hienpham0344.stayfinder.room.service;

import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record RoomBookingView(UUID id, UUID accommodationId, BigDecimal price, RoomStatus status,
                              String name, String description, Integer capacity) {
    public RoomBookingView(UUID id, UUID accommodationId, BigDecimal price, RoomStatus status,
                           String name, String description) {
        this(id, accommodationId, price, status, name, description, 1);
    }
    public RoomBookingView(UUID id, UUID accommodationId, BigDecimal price, RoomStatus status) {
        this(id, accommodationId, price, status, null, null, 1);
    }
}
