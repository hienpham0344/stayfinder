package io.github.hienpham0344.stayfinder.review.service;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.booking.service.BookingEligibility;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.review.dto.CreateReviewRequest;
import io.github.hienpham0344.stayfinder.review.dto.ReviewResponse;
import io.github.hienpham0344.stayfinder.review.dto.UpdateReviewRequest;
import io.github.hienpham0344.stayfinder.review.entity.Review;
import io.github.hienpham0344.stayfinder.review.mapper.ReviewMapper;
import io.github.hienpham0344.stayfinder.review.repository.ReviewRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingEligibility bookingEligibility;
    private final AccommodationLookup accommodationLookup;
    private final ReviewMapper mapper;

    public ReviewServiceImpl(ReviewRepository reviewRepository, BookingEligibility bookingEligibility,
                             AccommodationLookup accommodationLookup,
                             ReviewMapper mapper) {
        this.reviewRepository = reviewRepository;
        this.bookingEligibility = bookingEligibility;
        this.accommodationLookup = accommodationLookup;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> list(UUID accommodationId) {
        return reviewRepository.findByAccommodationIdOrderByCreatedAtDesc(accommodationId).stream()
                .map(mapper::toResponse).toList();
    }

    @Override
    @Transactional
    public ReviewResponse create(UUID accommodationId, CreateReviewRequest request) {
        UUID userId = CurrentUser.require().id();
        if (accommodationLookup.findBookingView(accommodationId).isEmpty()) {
            throw new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND);
        }
        if (!bookingEligibility.hasCompletedBookingForAccommodation(userId, request.bookingId(), accommodationId)) {
            throw new BusinessException(ErrorCode.BOOKING_SNAPSHOT_REQUIRED);
        }
        if (reviewRepository.findByBookingIdAndUserId(request.bookingId(), userId).isPresent()) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }
        Review review = new Review();
        review.setUserId(userId);
        review.setBookingId(request.bookingId());
        review.setAccommodationId(accommodationId);
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setCreatedAt(Instant.now());
        return mapper.toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public ReviewResponse update(UUID reviewId, UpdateReviewRequest request) {
        Review review = ownedReview(reviewId);
        review.setRating(request.rating());
        review.setComment(request.comment());
        return mapper.toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void delete(UUID reviewId) {
        reviewRepository.delete(ownedReview(reviewId));
    }

    private Review ownedReview(UUID reviewId) {
        UUID userId = CurrentUser.require().id();
        return reviewRepository.findById(reviewId)
                .filter(review -> userId.equals(review.getUserId()))
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN));
    }
}
