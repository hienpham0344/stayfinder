package io.github.hienpham0344.stayfinder.review.repository;

import io.github.hienpham0344.stayfinder.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByAccommodationIdOrderByCreatedAtDesc(UUID accommodationId);
    Optional<Review> findByBookingIdAndUserId(UUID bookingId, UUID userId);
}
