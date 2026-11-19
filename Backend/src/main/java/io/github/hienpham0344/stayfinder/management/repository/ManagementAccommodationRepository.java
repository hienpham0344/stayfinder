package io.github.hienpham0344.stayfinder.management.repository;

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

public interface ManagementAccommodationRepository extends JpaRepository<Accommodation, UUID> {
    @Query("select a from Accommodation a where a.partnerId = :partnerId "
            + "and (:status is null or a.status = :status)")
    Page<Accommodation> findOwned(@Param("partnerId") UUID partnerId,
                                  @Param("status") AccommodationStatus status, Pageable pageable);

    Optional<Accommodation> findByIdAndPartnerId(UUID id, UUID partnerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Accommodation a where a.id = :id and a.partnerId = :partnerId")
    Optional<Accommodation> lockOwnedForEdit(@Param("id") UUID id, @Param("partnerId") UUID partnerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Accommodation a where a.id = :id")
    Optional<Accommodation> lockById(@Param("id") UUID id);

    @Query("select a from Accommodation a where (:status is null or a.status = :status) "
            + "and (:partnerId is null or a.partnerId = :partnerId)")
    Page<Accommodation> search(@Param("status") AccommodationStatus status,
                               @Param("partnerId") UUID partnerId, Pageable pageable);
}
