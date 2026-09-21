package io.github.hienpham0344.stayfinder.booking.repository;

import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    Page<Booking> findByUserId(UUID userId, Pageable pageable);
    Page<Booking> findByUserIdAndStatus(UUID userId, BookingStatus status, Pageable pageable);
    Optional<Booking> findByIdAndUserId(UUID id, UUID userId);
}
