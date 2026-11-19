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

    default Page<Booking> findOwned(UUID partnerId, BookingStatus status, Pageable pageable) {
        return status == null ? findOwnedWithoutStatus(partnerId, pageable)
                : findOwnedByStatus(partnerId, status, pageable);
    }

    @Query("select b from Booking b where " + OWNED)
    Page<Booking> findOwnedWithoutStatus(@Param("partnerId") UUID partnerId, Pageable pageable);

    @Query("select b from Booking b where " + OWNED + " and b.status = :status")
    Page<Booking> findOwnedByStatus(@Param("partnerId") UUID partnerId,
                                    @Param("status") BookingStatus status, Pageable pageable);

    @Query("select b from Booking b where b.id = :id and " + OWNED)
    Optional<Booking> findOwnedById(@Param("id") UUID id, @Param("partnerId") UUID partnerId);

    default Page<Booking> search(BookingStatus status, UUID userId, Pageable pageable) {
        if (status == null && userId == null) return searchAll(pageable);
        if (status == null) return searchByUser(userId, pageable);
        if (userId == null) return searchByStatus(status, pageable);
        return searchByStatusAndUser(status, userId, pageable);
    }

    @Query("select b from Booking b")
    Page<Booking> searchAll(Pageable pageable);

    @Query("select b from Booking b where b.status = :status")
    Page<Booking> searchByStatus(@Param("status") BookingStatus status, Pageable pageable);

    @Query("select b from Booking b where b.userId = :userId")
    Page<Booking> searchByUser(@Param("userId") UUID userId, Pageable pageable);

    @Query("select b from Booking b where b.status = :status and b.userId = :userId")
    Page<Booking> searchByStatusAndUser(@Param("status") BookingStatus status, @Param("userId") UUID userId,
                                        Pageable pageable);

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
