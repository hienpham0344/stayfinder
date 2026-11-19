package io.github.hienpham0344.stayfinder.partner.repository;

import io.github.hienpham0344.stayfinder.partner.entity.PartnerApplication;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PartnerApplicationRepository extends JpaRepository<PartnerApplication, UUID> {
    Optional<PartnerApplication> findByUserId(UUID userId);

    @Query("select a.userId from PartnerApplication a where a.id = :id")
    Optional<UUID> findUserIdById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from PartnerApplication a where a.userId = :userId")
    Optional<PartnerApplication> lockByUserId(@Param("userId") UUID userId);

    @Query("select a from PartnerApplication a where (:status is null or a.status = :status)")
    Page<PartnerApplication> search(@Param("status") PartnerApplication.Status status, Pageable pageable);
}
