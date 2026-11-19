package io.github.hienpham0344.stayfinder.management.repository;

import io.github.hienpham0344.stayfinder.review.entity.Review;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ManagementReviewRepository extends JpaRepository<Review, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Review r where r.id = :id")
    Optional<Review> lockById(@Param("id") UUID id);

    @Query("select r from Review r where (:hidden is null or r.hidden = :hidden) "
            + "and (:accommodationId is null or r.accommodationId = :accommodationId)")
    Page<Review> search(@Param("hidden") Boolean hidden, @Param("accommodationId") UUID accommodationId,
                        Pageable pageable);
}
