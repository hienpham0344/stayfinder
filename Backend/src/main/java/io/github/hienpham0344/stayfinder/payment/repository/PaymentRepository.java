package io.github.hienpham0344.stayfinder.payment.repository;

import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByBookingId(UUID bookingId);
    Optional<Payment> findByTransactionId(String transactionId);
}
