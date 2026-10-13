package io.github.hienpham0344.stayfinder.booking.repository;

import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select b from Booking b where b.id=:id and b.userId=:userId")
    Optional<Booking> lockOwned(@org.springframework.data.repository.query.Param("id") UUID id,@org.springframework.data.repository.query.Param("userId") UUID userId);
    @org.springframework.data.jpa.repository.Query("select b.id from Booking b where b.status=io.github.hienpham0344.stayfinder.common.enums.BookingStatus.PENDING and b.paymentMethod='bank_transfer' and b.paidAt is null and b.holdExpiresAt<=:now order by b.holdExpiresAt,b.id")
    java.util.List<UUID> findExpiredPendingIds(@org.springframework.data.repository.query.Param("now") java.time.Instant now,Pageable pageable);
    @org.springframework.data.jpa.repository.Query(value="select b.id from bookings b join booking_quotes q on q.id=b.quote_id where b.status='confirmed' and b.paid_at is not null and b.payment_status='success' and b.refund_status='none' and ((q.check_out+time '11:00') at time zone q.timezone)<=:now order by q.check_out,b.id",nativeQuery=true)
    java.util.List<UUID> findCompletionCandidateIds(@org.springframework.data.repository.query.Param("now") java.time.Instant now,Pageable pageable);
    Page<Booking> findByUserId(UUID userId, Pageable pageable);
    Page<Booking> findByUserIdAndStatus(UUID userId, BookingStatus status, Pageable pageable);
    Optional<Booking> findByIdAndUserId(UUID id, UUID userId);
}
