package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AccommodationRepository extends JpaRepository<Accommodation, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select a from Accommodation a where a.id=:id")
    java.util.Optional<Accommodation> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
    Page<Accommodation> findByStatus(AccommodationStatus status, Pageable pageable);
}
