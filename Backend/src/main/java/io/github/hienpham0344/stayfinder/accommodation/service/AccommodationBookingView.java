package io.github.hienpham0344.stayfinder.accommodation.service;

import java.math.BigDecimal;
import java.util.UUID;

public record AccommodationBookingView(UUID id, BigDecimal basePrice) {
}
