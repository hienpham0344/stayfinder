package io.github.hienpham0344.stayfinder.accommodation.service;

import java.util.UUID;
import java.util.Optional;

public interface AccommodationLookup {
    Optional<AccommodationBookingView> findBookingView(UUID accommodationId);
}
