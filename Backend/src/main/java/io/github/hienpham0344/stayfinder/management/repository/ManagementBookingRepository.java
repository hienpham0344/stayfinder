package io.github.hienpham0344.stayfinder.management.repository;

import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ManagementBookingRepository extends JpaRepository<Booking, UUID> {
    String OWNED_IDS = "select d.bookingId from BookingDetail d, AccommodationSnapshot s, Accommodation a "
            + "where d.accommodationSnapshotId = s.id and s.accommodationId = a.id and a.partnerId = :partnerId";
    String OWNED = "b.id in (" + OWNED_IDS + ")";
    String COUNTS = "select count(b.id) as total, "
            + "sum(case when b.status = :pending then 1 else 0 end) as pendingCount, "
            + "sum(case when b.status = :cancelled then 1 else 0 end) as cancelledCount, "
            + "sum(case when b.status = :completed then 1 else 0 end) as completedCount from Booking b";

    @Query("select b from Booking b where " + OWNED + " and (:status is null or b.status = :status)")
    Page<Booking> findOwned(@Param("partnerId") UUID partnerId,
                             @Param("status") BookingStatus status, Pageable pageable);

    @Query("select b from Booking b where b.id = :id and " + OWNED)
    Optional<Booking> findOwnedById(@Param("id") UUID id, @Param("partnerId") UUID partnerId);

    @Query("select b from Booking b where (:status is null or b.status = :status) "
            + "and (:userId is null or b.userId = :userId)")
    Page<Booking> search(@Param("status") BookingStatus status, @Param("userId") UUID userId, Pageable pageable);

    @Query(COUNTS + " where " + OWNED)
    BookingCounts countsOwned(@Param("partnerId") UUID partnerId, @Param("pending") BookingStatus pending,
                           @Param("cancelled") BookingStatus cancelled, @Param("completed") BookingStatus completed);

    @Query(COUNTS)
    BookingCounts countsAll(@Param("pending") BookingStatus pending,
                           @Param("cancelled") BookingStatus cancelled, @Param("completed") BookingStatus completed);

    interface BookingCounts {
        Long getTotal();
        Long getPendingCount();
        Long getCancelledCount();
        Long getCompletedCount();
    }
}
