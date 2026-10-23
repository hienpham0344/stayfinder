package io.github.hienpham0344.stayfinder.review.service;import io.github.hienpham0344.stayfinder.review.dto.*;import io.github.hienpham0344.stayfinder.common.response.PageResponse;import org.springframework.data.domain.Pageable;import java.util.UUID;
public interface ReviewService{
 PageResponse<ReviewResponse> list(UUID accommodationId,Integer star,Pageable page,UUID viewer);
 ReviewSummary summary(UUID accommodationId);ReviewResponse create(UUID userId,UUID accommodationId,CreateReviewRequest request);
 ReviewResponse update(UUID userId,UUID reviewId,UpdateReviewRequest request);void delete(UUID userId,UUID reviewId);
}
