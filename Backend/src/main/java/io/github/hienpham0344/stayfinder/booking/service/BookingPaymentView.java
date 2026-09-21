package io.github.hienpham0344.stayfinder.booking.service;

import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record BookingPaymentView(UUID id, UUID userId, BigDecimal totalPrice, BookingStatus status) {
}
