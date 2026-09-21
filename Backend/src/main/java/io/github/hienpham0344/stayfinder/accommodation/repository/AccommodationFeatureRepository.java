package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeature;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeatureId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AccommodationFeatureRepository extends JpaRepository<AccommodationFeature, AccommodationFeatureId> {
    List<AccommodationFeature> findByIdAccommodationId(UUID accommodationId);
}
