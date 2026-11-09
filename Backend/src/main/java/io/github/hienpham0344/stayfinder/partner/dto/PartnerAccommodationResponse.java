package io.github.hienpham0344.stayfinder.partner.dto;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationDetailResponse;

import java.util.UUID;

public record PartnerAccommodationResponse(AccommodationDetailResponse detail, UUID locationId, String timezone,
                                           Long cleaningFeeCents, Long serviceFeeCents, Integer bedrooms,
                                           Integer beds, Integer baths) {
}
