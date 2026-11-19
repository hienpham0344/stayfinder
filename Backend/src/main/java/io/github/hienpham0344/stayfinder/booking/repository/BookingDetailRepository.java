package io.github.hienpham0344.stayfinder.booking.repository;

import io.github.hienpham0344.stayfinder.booking.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.Instant;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import java.util.List;
import java.util.Collection;
import java.util.UUID;

public interface BookingDetailRepository extends JpaRepository<BookingDetail, UUID> {
    List<BookingDetail> findByBookingId(UUID bookingId);
    List<BookingDetail> findByBookingIdIn(Collection<UUID> bookingIds);

    @Query("select d from BookingDetail d where d.roomSnapshotId in "
            + "(select s.id from RoomSnapshot s where s.roomId = :roomId) "
            + "and d.checkInDate < :checkOut and d.checkOutDate > :checkIn "
            + "and d.bookingId in (select b.id from Booking b where b.status in :statuses)")
    List<BookingDetail> findOverlappingRoomBookings(@Param("roomId") UUID roomId,
                                                     @Param("checkIn") LocalDate checkIn,
                                                     @Param("checkOut") LocalDate checkOut,
                                                     @Param("statuses") java.util.Collection<io.github.hienpham0344.stayfinder.common.enums.BookingStatus> statuses);

    @Query("select distinct s.roomId from BookingDetail d, RoomSnapshot s "
            + "where d.roomSnapshotId = s.id and s.roomId in :roomIds "
            + "and d.checkInDate < :checkOut and d.checkOutDate > :checkIn "
            + "and d.bookingId in (select b.id from Booking b where b.status in :statuses)")
    List<UUID> findOverlappingRoomIds(@Param("roomIds") Collection<UUID> roomIds,
                                      @Param("checkIn") LocalDate checkIn,
                                      @Param("checkOut") LocalDate checkOut,
                                      @Param("statuses") Collection<io.github.hienpham0344.stayfinder.common.enums.BookingStatus> statuses);
    @Query("select (count(d)>0) from BookingDetail d, RoomSnapshot s, Booking b "
            + "where d.roomSnapshotId=s.id and d.bookingId=b.id and s.roomId=:roomId "
            + "and d.checkInDate<:checkOut and d.checkOutDate>:checkIn "
            + "and (b.status=:confirmed or (b.status=:pending and (b.expiresAt>:now or (b.expiresAt is null and b.createdAt>:legacyCutoff))))")
    boolean hasActiveOverlap(@Param("roomId") UUID roomId, @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut,
                             @Param("confirmed") BookingStatus confirmed, @Param("pending") BookingStatus pending,
                             @Param("now") Instant now, @Param("legacyCutoff") Instant legacyCutoff);
    @Query("select distinct s.roomId from BookingDetail d, RoomSnapshot s, Booking b "
            + "where d.roomSnapshotId=s.id and d.bookingId=b.id and s.roomId in :roomIds "
            + "and d.checkInDate<:checkOut and d.checkOutDate>:checkIn "
            + "and (b.status=:confirmed or (b.status=:pending and (b.expiresAt>:now or (b.expiresAt is null and b.createdAt>:legacyCutoff))))")
    List<UUID> findActiveOverlappingRoomIds(@Param("roomIds") Collection<UUID> roomIds, @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut,
                                           @Param("confirmed") BookingStatus confirmed, @Param("pending") BookingStatus pending,
                                           @Param("now") Instant now, @Param("legacyCutoff") Instant legacyCutoff);
}
