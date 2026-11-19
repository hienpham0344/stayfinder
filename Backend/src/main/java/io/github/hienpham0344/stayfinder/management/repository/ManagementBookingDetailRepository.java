package io.github.hienpham0344.stayfinder.management.repository;

import io.github.hienpham0344.stayfinder.booking.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ManagementBookingDetailRepository extends JpaRepository<BookingDetail, UUID> {
    @Query("select d.id as id, a.accommodationId as accommodationId, a.name as accommodationName, "
            + "r.roomId as roomId, r.name as roomName, d.checkInDate as checkIn, d.checkOutDate as checkOut, "
            + "d.quantity as quantity, d.guests as guests, d.subtotal as subtotal "
            + "from BookingDetail d, AccommodationSnapshot a, RoomSnapshot r "
            + "where d.bookingId = :bookingId and d.accommodationSnapshotId = a.id and d.roomSnapshotId = r.id "
            + "and (:partnerId is null or exists (select p.id from Accommodation p "
            + "where p.id = a.accommodationId and p.partnerId = :partnerId)) order by d.id")
    List<BookingLine> lines(@Param("bookingId") UUID bookingId, @Param("partnerId") UUID partnerId);

    interface BookingLine {
        UUID getId();
        UUID getAccommodationId();
        String getAccommodationName();
        UUID getRoomId();
        String getRoomName();
        LocalDate getCheckIn();
        LocalDate getCheckOut();
        Integer getQuantity();
        Integer getGuests();
        BigDecimal getSubtotal();
    }
}
