package io.github.hienpham0344.stayfinder.room.repository;

import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from Room r where r.id=:id")
    java.util.Optional<Room> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
    java.util.List<Room> findByAccommodationIdAndStatus(UUID accommodationId, RoomStatus status);
}
