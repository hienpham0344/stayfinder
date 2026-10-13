package io.github.hienpham0344.stayfinder.reward.repository;
import io.github.hienpham0344.stayfinder.reward.entity.RewardReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface RewardReservationRepository extends JpaRepository<RewardReservation,UUID> {
 @Query("select r.userId from RewardReservation r where r.bookingId=:bookingId")
 Optional<UUID> findOwnerByBookingId(@Param("bookingId") UUID bookingId);
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select r from RewardReservation r where r.bookingId=:id")
 Optional<RewardReservation> lockById(@Param("id") UUID id);
}
