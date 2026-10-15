package io.github.hienpham0344.stayfinder.review.repository;
import io.github.hienpham0344.stayfinder.review.entity.Review;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import org.springframework.data.domain.*;import jakarta.persistence.LockModeType;import java.util.*;
public interface ReviewRepository extends JpaRepository<Review,UUID>{
 Optional<Review> findByBookingIdAndUserId(UUID bookingId,UUID userId);
 boolean existsByBookingIdAndUserId(UUID bookingId,UUID userId);
 Page<Review> findByAccommodationId(UUID accommodationId,Pageable page);
 Page<Review> findByAccommodationIdAndRating(UUID accommodationId,Integer rating,Pageable page);
 @Lock(LockModeType.PESSIMISTIC_WRITE)@Query("select r from Review r where r.id=:id")Optional<Review> lockById(@Param("id")UUID id);
 interface RatingCount{Integer getRating();Long getCount();}
 @Query("select r.rating as rating,count(r) as count from Review r where r.accommodationId=:id group by r.rating")List<RatingCount> ratingCounts(@Param("id")UUID id);
}
