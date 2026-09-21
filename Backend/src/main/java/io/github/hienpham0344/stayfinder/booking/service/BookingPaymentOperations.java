package io.github.hienpham0344.stayfinder.booking.service;

import java.util.Optional;
import java.util.UUID;

public interface BookingPaymentOperations {
    Optional<BookingPaymentView> find(UUID bookingId);
    Optional<BookingPaymentView> findOwned(UUID bookingId, UUID userId);
    void confirm(UUID bookingId);
}
