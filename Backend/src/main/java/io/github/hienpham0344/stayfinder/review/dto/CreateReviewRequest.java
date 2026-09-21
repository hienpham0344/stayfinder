package io.github.hienpham0344.stayfinder.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReviewRequest(UUID bookingId, @Min(1) @Max(5) Integer rating,
                                  @Size(max = 2000) String comment) {
}
