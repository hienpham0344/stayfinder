package io.github.hienpham0344.stayfinder.accommodation.entity;

import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatusConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "accommodations")
@Getter @Setter @NoArgsConstructor
public class Accommodation {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "partner_id") private UUID partnerId;
    @Column(name = "type_id") private UUID typeId;
    private String name;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String description;
    @Column(name = "base_price") private BigDecimal basePrice;
    @Convert(converter = AccommodationStatusConverter.class) private AccommodationStatus status;
    @Column(name = "created_at") private Instant createdAt;
}
