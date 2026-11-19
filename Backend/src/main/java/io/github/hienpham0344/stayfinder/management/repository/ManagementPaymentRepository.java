package io.github.hienpham0344.stayfinder.management.repository;

import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface ManagementPaymentRepository extends JpaRepository<Payment, UUID> {
    String OWNED = "p.bookingId in (" + ManagementBookingRepository.OWNED_IDS + ")";

    @Query("select p from Payment p where " + OWNED + " and (:status is null or p.status = :status) "
            + "and (:bookingId is null or p.bookingId = :bookingId)")
    Page<Payment> findOwned(@Param("partnerId") UUID partnerId, @Param("status") PaymentStatus status,
                             @Param("bookingId") UUID bookingId, Pageable pageable);

    @Query("select p from Payment p where p.id = :id and " + OWNED)
    Optional<Payment> findOwnedById(@Param("id") UUID id, @Param("partnerId") UUID partnerId);

    @Query("select p from Payment p where (:status is null or p.status = :status) "
            + "and (:bookingId is null or p.bookingId = :bookingId)")
    Page<Payment> search(@Param("status") PaymentStatus status, @Param("bookingId") UUID bookingId,
                         Pageable pageable);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :success and " + OWNED)
    BigDecimal receivedRevenueOwned(@Param("partnerId") UUID partnerId, @Param("success") PaymentStatus success);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :success")
    BigDecimal receivedRevenueAll(@Param("success") PaymentStatus success);
}
