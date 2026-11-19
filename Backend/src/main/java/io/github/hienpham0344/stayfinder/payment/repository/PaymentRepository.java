package io.github.hienpham0344.stayfinder.payment.repository;

import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    @Query("select p.bookingId from Payment p where p.id=:id")
    Optional<UUID> findBookingIdById(@Param("id") UUID id);
    List<Payment> findByBookingId(UUID bookingId);
    Optional<Payment> findByTransactionId(String transactionId);
}
