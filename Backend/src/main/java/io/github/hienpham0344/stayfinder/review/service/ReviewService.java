package io.github.hienpham0344.stayfinder.review.service;

import io.github.hienpham0344.stayfinder.review.dto.CreateReviewRequest;
import io.github.hienpham0344.stayfinder.review.dto.ReviewResponse;
import io.github.hienpham0344.stayfinder.review.dto.UpdateReviewRequest;

import java.util.List;
import java.util.UUID;

public interface ReviewService {
    List<ReviewResponse> list(UUID accommodationId);
    ReviewResponse create(UUID accommodationId, CreateReviewRequest request);
    ReviewResponse update(UUID reviewId, UpdateReviewRequest request);
    void delete(UUID reviewId);
}
