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
        // Keep optional predicates out of prepared SQL so PostgreSQL can use a specific plan.
        if (bookingId == null && status == null) return findOwnedWithoutFilters(partnerId, pageable);
        if (bookingId == null) return findOwnedByStatus(partnerId, status, pageable);
        if (status == null) return findOwnedByBooking(partnerId, bookingId, pageable);
        return findOwnedByBookingAndStatus(partnerId, bookingId, status, pageable);
    }

    @Query("select p from Payment p where " + OWNED)
    Page<Payment> findOwnedWithoutFilters(@Param("partnerId") UUID partnerId, Pageable pageable);

    @Query("select p from Payment p where " + OWNED + " and p.status = :status")
    Page<Payment> findOwnedByStatus(@Param("partnerId") UUID partnerId,
                                    @Param("status") PaymentStatus status, Pageable pageable);

    @Query("select p from Payment p where " + OWNED + " and p.bookingId = :bookingId")
    Page<Payment> findOwnedByBooking(@Param("partnerId") UUID partnerId, @Param("bookingId") UUID bookingId,
                                     Pageable pageable);

    @Query("select p from Payment p where " + OWNED + " and p.bookingId = :bookingId and p.status = :status")
    Page<Payment> findOwnedByBookingAndStatus(@Param("partnerId") UUID partnerId,
                                              @Param("bookingId") UUID bookingId,
                                              @Param("status") PaymentStatus status, Pageable pageable);

    @Query("select p from Payment p where p.id = :id and " + OWNED)
    Optional<Payment> findOwnedById(@Param("id") UUID id, @Param("partnerId") UUID partnerId);

    default Page<Payment> search(PaymentStatus status, UUID bookingId, Pageable pageable) {
        if (bookingId == null && status == null) return searchAll(pageable);
        if (bookingId == null) return searchByStatus(status, pageable);
        if (status == null) return searchByBooking(bookingId, pageable);
        return searchByBookingAndStatus(bookingId, status, pageable);
    }

    @Query("select p from Payment p")
    Page<Payment> searchAll(Pageable pageable);

    @Query("select p from Payment p where p.status = :status")
    Page<Payment> searchByStatus(@Param("status") PaymentStatus status, Pageable pageable);

    @Query("select p from Payment p where p.bookingId = :bookingId")
    Page<Payment> searchByBooking(@Param("bookingId") UUID bookingId, Pageable pageable);

    @Query("select p from Payment p where p.bookingId = :bookingId and p.status = :status")
    Page<Payment> searchByBookingAndStatus(@Param("bookingId") UUID bookingId,
                                           @Param("status") PaymentStatus status, Pageable pageable);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :success and " + OWNED)
    BigDecimal receivedRevenueOwned(@Param("partnerId") UUID partnerId, @Param("success") PaymentStatus success);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :success")
    BigDecimal receivedRevenueAll(@Param("success") PaymentStatus success);
}
