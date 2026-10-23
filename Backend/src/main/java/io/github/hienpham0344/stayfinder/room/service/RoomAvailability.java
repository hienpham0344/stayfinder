package io.github.hienpham0344.stayfinder.room.service;
import java.time.*;
import java.util.UUID;
public interface RoomAvailability { int remaining(UUID roomId,LocalDate checkIn,LocalDate checkOut,Instant now); }
