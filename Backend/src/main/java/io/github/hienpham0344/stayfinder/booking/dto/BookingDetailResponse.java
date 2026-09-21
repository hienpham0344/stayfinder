package io.github.hienpham0344.stayfinder.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BookingDetailResponse(UUID id, UUID roomSnapshotId, LocalDate checkInDate,
                                    LocalDate checkOutDate, Integer quantity, BigDecimal subtotal) {
}
