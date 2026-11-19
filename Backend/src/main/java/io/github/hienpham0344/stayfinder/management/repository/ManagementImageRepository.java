package io.github.hienpham0344.stayfinder.management.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ManagementImageRepository extends JpaRepository<Image, UUID> {
    List<Image> findByAccommodationIdOrderById(UUID accommodationId);
    @Modifying(flushAutomatically = true)
    @Query("delete from Image i where i.accommodationId = :id")
    void deleteByAccommodationId(@Param("id") UUID accommodationId);
}
