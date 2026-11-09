package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AccommodationSnapshotRepository extends JpaRepository<AccommodationSnapshot, UUID> {
    boolean existsByIdAndAccommodationId(UUID id, UUID accommodationId);
}
