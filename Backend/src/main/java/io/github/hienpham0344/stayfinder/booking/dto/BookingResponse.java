package io.github.hienpham0344.stayfinder.booking.dto;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
public record BookingResponse(UUID id, UUID userId, BigDecimal totalPrice, BookingStatus status,
                              Instant createdAt, List<BookingDetailResponse> details,
                              Instant expiresAt, String cancellationReason, BigDecimal subtotal,
                              BigDecimal discountAmount, UUID voucherId, String voucherPolicy) {
    public BookingResponse(UUID id, UUID userId, BigDecimal totalPrice, BookingStatus status,
                           Instant createdAt, List<BookingDetailResponse> details) {
        this(id,userId,totalPrice,status,createdAt,details,null,null,totalPrice,BigDecimal.ZERO,null,null);
    }
}
