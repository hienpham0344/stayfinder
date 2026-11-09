package io.github.hienpham0344.stayfinder.payment.repository;

import io.github.hienpham0344.stayfinder.payment.entity.PaymentSimulationAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PaymentSimulationAttemptRepository extends JpaRepository<PaymentSimulationAttempt, UUID> {
    Page<PaymentSimulationAttempt> findByBookingIdAndUserId(UUID bookingId, UUID userId, Pageable pageable);
}
