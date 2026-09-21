package io.github.hienpham0344.stayfinder.booking.service;

import java.util.UUID;

public interface BookingEligibility {
    boolean hasCompletedBookingForAccommodation(UUID userId, UUID bookingId, UUID accommodationId);
}
