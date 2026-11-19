package io.github.hienpham0344.stayfinder.booking.repository;

import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.UUID;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    Page<Booking> findByUserId(UUID userId, Pageable pageable);
    Page<Booking> findByUserIdAndStatus(UUID userId, BookingStatus status, Pageable pageable);
    Optional<Booking> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByIdAndUserId(UUID id, UUID userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findForPaymentUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id and b.userId = :userId")
    Optional<Booking> findOwnedForPaymentUpdate(@Param("id") UUID id, @Param("userId") UUID userId);
    @Query("select b.id from Booking b where b.status=:status and b.expiresAt<=:now order by b.expiresAt,b.id")
    List<UUID> findExpiredIds(@Param("status") BookingStatus status, @Param("now") Instant now, Pageable pageable);
    @Query("select b.id from Booking b where b.status=:status and exists (select d.id from BookingDetail d where d.bookingId=b.id and d.checkOutDate<=:through) and not exists (select d.id from BookingDetail d where d.bookingId=b.id and (d.checkOutDate is null or d.checkOutDate>:through)) and b.totalPrice>0 and (select sum(p.amount) from Payment p where p.bookingId=b.id and p.status=io.github.hienpham0344.stayfinder.common.enums.PaymentStatus.SUCCESS)=b.totalPrice order by b.createdAt,b.id")
    List<UUID> findCompletableIds(@Param("status") BookingStatus status, @Param("through") LocalDate through, Pageable pageable);
}
