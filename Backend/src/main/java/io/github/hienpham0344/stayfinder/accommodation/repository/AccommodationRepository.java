package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface AccommodationRepository extends JpaRepository<Accommodation, UUID> {
    Page<Accommodation> findByStatus(AccommodationStatus status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Accommodation a where a.id = :id")
    Optional<Accommodation> findForBooking(@Param("id") UUID id);
}
