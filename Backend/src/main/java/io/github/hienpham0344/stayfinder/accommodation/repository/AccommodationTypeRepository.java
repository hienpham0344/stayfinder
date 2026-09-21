package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AccommodationTypeRepository extends JpaRepository<AccommodationType, UUID> {
}
