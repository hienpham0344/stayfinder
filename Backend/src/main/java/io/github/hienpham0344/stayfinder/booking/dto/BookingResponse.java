package io.github.hienpham0344.stayfinder.booking.dto;

import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BookingResponse(UUID id, UUID userId, BigDecimal totalPrice, BookingStatus status,
                              Instant createdAt, List<BookingDetailResponse> details) {
}
