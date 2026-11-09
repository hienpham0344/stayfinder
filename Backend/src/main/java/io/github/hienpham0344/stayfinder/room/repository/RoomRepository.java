package io.github.hienpham0344.stayfinder.room.repository;

import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    java.util.List<Room> findByAccommodationIdAndStatus(UUID accommodationId, RoomStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :roomId")
    java.util.Optional<Room> findForBooking(@Param("roomId") UUID roomId);
}
