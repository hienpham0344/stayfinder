package io.github.hienpham0344.stayfinder.booking.service;

import java.time.LocalDate;
import java.util.UUID;

public interface RoomBookingAvailability {
    boolean hasOverlap(UUID roomId, LocalDate checkIn, LocalDate checkOut);
}
