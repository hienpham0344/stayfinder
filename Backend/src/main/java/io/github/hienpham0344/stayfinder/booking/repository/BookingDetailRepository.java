package io.github.hienpham0344.stayfinder.booking.repository;
import io.github.hienpham0344.stayfinder.booking.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BookingDetailRepository extends JpaRepository<BookingDetail,UUID> {
 List<BookingDetail> findByBookingId(UUID bookingId);
}
