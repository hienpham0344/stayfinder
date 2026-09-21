package io.github.hienpham0344.stayfinder.room.service;

import io.github.hienpham0344.stayfinder.room.dto.RoomResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RoomService {
    List<RoomResponse> listAvailable(UUID accommodationId, LocalDate checkIn, LocalDate checkOut, int guests);
}
