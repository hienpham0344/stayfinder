package io.github.hienpham0344.stayfinder.management.repository;

import io.github.hienpham0344.stayfinder.payment.entity.PaymentAnomaly;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ManagementPaymentAnomalyRepository extends JpaRepository<PaymentAnomaly, UUID> {
    @Query("select a from PaymentAnomaly a where (:bookingId is null or a.bookingId = :bookingId) "
            + "and (:reason is null or a.reason = :reason)")
    Page<PaymentAnomaly> search(@Param("bookingId") UUID bookingId, @Param("reason") String reason, Pageable pageable);
}
