package io.github.hienpham0344.stayfinder.room.repository;

import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    java.util.List<Room> findByAccommodationIdAndStatus(UUID accommodationId, RoomStatus status);
}
