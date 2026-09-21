package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.Feature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FeatureRepository extends JpaRepository<Feature, UUID> {
}
