package io.github.hienpham0344.stayfinder.accommodation.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(name = "accommodation_features") @Getter @Setter @NoArgsConstructor
public class AccommodationFeature {
    @EmbeddedId private AccommodationFeatureId id;
}
