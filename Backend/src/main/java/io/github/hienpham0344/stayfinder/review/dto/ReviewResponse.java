package io.github.hienpham0344.stayfinder.review.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(UUID id, UUID userId, UUID bookingId, UUID accommodationId,
                             Integer rating, String comment, Instant createdAt) {
}
