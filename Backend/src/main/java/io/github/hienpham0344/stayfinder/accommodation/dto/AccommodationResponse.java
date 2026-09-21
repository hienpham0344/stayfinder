package io.github.hienpham0344.stayfinder.accommodation.dto;

import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record AccommodationResponse(UUID id, String name, String address, BigDecimal latitude,
                                    BigDecimal longitude, String description, BigDecimal basePrice,
                                    AccommodationStatus status, UUID typeId) {
}
