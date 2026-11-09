package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface AccommodationRepository extends JpaRepository<Accommodation, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Accommodation a where a.id = :id")
    Optional<Accommodation> lockById(@Param("id") UUID id);

    Page<Accommodation> findByStatus(AccommodationStatus status, Pageable pageable);
    Page<Accommodation> findByPartnerId(UUID partnerId, Pageable pageable);
    Optional<Accommodation> findByIdAndPartnerId(UUID id, UUID partnerId);
    boolean existsByIdAndPartnerId(UUID id, UUID partnerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Accommodation a where a.id = :id and a.partnerId = :partnerId")
    Optional<Accommodation> lockOwned(@Param("id") UUID id, @Param("partnerId") UUID partnerId);
}
