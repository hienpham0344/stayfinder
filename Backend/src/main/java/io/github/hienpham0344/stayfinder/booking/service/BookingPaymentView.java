package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public record BookingPaymentView(UUID id, UUID userId, BigDecimal totalPrice, BookingStatus status, Instant expiresAt) {
    public BookingPaymentView(UUID id,UUID userId,BigDecimal totalPrice,BookingStatus status) { this(id,userId,totalPrice,status,null); }
    public boolean expiredAt(Instant now) { return expiresAt!=null && !expiresAt.isAfter(now); }
}
