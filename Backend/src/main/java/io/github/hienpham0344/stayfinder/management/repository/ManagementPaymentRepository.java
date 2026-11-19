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

    default Page<Payment> findOwned(UUID partnerId, PaymentStatus status, UUID bookingId, Pageable pageable) {
        // Keep the booking predicate explicit: a nullable OR produces poor generic prepared plans.
        return bookingId == null ? findOwnedWithoutBooking(partnerId, status, pageable)
                : findOwnedForBooking(partnerId, status, bookingId, pageable);
    }

    @Query("select p from Payment p where " + OWNED + " and (:status is null or p.status = :status)")
    Page<Payment> findOwnedWithoutBooking(@Param("partnerId") UUID partnerId,
                                        @Param("status") PaymentStatus status, Pageable pageable);

    @Query("select p from Payment p where " + OWNED + " and p.bookingId = :bookingId "
            + "and (:status is null or p.status = :status)")
    Page<Payment> findOwnedForBooking(@Param("partnerId") UUID partnerId, @Param("status") PaymentStatus status,
                                    @Param("bookingId") UUID bookingId, Pageable pageable);

    @Query("select p from Payment p where p.id = :id and " + OWNED)
    Optional<Payment> findOwnedById(@Param("id") UUID id, @Param("partnerId") UUID partnerId);

    default Page<Payment> search(PaymentStatus status, UUID bookingId, Pageable pageable) {
        return bookingId == null ? searchWithoutBooking(status, pageable)
                : searchForBooking(status, bookingId, pageable);
    }

    @Query("select p from Payment p where (:status is null or p.status = :status)")
    Page<Payment> searchWithoutBooking(@Param("status") PaymentStatus status, Pageable pageable);

    @Query("select p from Payment p where p.bookingId = :bookingId and (:status is null or p.status = :status)")
    Page<Payment> searchForBooking(@Param("status") PaymentStatus status, @Param("bookingId") UUID bookingId,
                                   Pageable pageable);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :success and " + OWNED)
    BigDecimal receivedRevenueOwned(@Param("partnerId") UUID partnerId, @Param("success") PaymentStatus success);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :success")
    BigDecimal receivedRevenueAll(@Param("success") PaymentStatus success);
}
