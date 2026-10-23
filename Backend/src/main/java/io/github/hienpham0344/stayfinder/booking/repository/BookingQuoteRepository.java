package io.github.hienpham0344.stayfinder.booking.repository;
import io.github.hienpham0344.stayfinder.booking.entity.BookingQuote;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface BookingQuoteRepository extends JpaRepository<BookingQuote,UUID> {
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select q from BookingQuote q where q.id=:id and q.userId=:userId")
 Optional<BookingQuote> lockOwned(@Param("id") UUID id,@Param("userId") UUID userId);
}
