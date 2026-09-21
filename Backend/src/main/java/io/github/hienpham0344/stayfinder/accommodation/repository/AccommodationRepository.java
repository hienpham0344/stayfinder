package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AccommodationRepository extends JpaRepository<Accommodation, UUID> {
    Page<Accommodation> findByStatus(AccommodationStatus status, Pageable pageable);
}
