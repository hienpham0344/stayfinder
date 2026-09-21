package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ImageRepository extends JpaRepository<Image, UUID> {
    List<Image> findByAccommodationId(UUID accommodationId);
}
