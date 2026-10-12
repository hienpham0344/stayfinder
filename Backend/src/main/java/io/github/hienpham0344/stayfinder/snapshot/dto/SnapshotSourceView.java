package io.github.hienpham0344.stayfinder.snapshot.dto;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import java.time.*;
import java.util.UUID;
public record SnapshotSourceView(UUID bookingId,UUID roomSnapshotId,UUID accommodationSnapshotId,
        UUID sourceRoomId,UUID sourceAccommodationId,LocalDate checkIn,LocalDate checkOut,
        Integer quantity,BookingStatus status,Instant holdExpiresAt) {}
