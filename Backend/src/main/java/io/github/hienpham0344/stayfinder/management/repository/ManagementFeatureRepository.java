package io.github.hienpham0344.stayfinder.management.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeature;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeatureId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ManagementFeatureRepository extends JpaRepository<AccommodationFeature, AccommodationFeatureId> {
    List<AccommodationFeature> findByIdAccommodationId(UUID accommodationId);
    @Modifying(flushAutomatically = true)
    @Query("delete from AccommodationFeature f where f.id.accommodationId = :id")
    void deleteByIdAccommodationId(@Param("id") UUID accommodationId);
}
