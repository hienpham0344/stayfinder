package io.github.hienpham0344.stayfinder.review.controller;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.review.dto.CreateReviewRequest;
import io.github.hienpham0344.stayfinder.review.dto.ReviewResponse;
import io.github.hienpham0344.stayfinder.review.dto.UpdateReviewRequest;
import io.github.hienpham0344.stayfinder.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class ReviewController {
    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    @GetMapping("/api/accommodations/{accommodationId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> list(@PathVariable UUID accommodationId) {
        return ResponseEntity.ok(ApiResponse.success(service.list(accommodationId)));
    }

    @PostMapping("/api/accommodations/{accommodationId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> create(@PathVariable UUID accommodationId,
                                                               @Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(accommodationId, request)));
    }

    @PatchMapping("/api/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> update(@PathVariable UUID reviewId,
                                                               @Valid @RequestBody UpdateReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(reviewId, request)));
    }

    @DeleteMapping("/api/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID reviewId) {
        service.delete(reviewId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
