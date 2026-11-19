package io.github.hienpham0344.stayfinder.management.repository;

import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ManagementRoomRepository extends JpaRepository<Room, UUID> {
    boolean existsByAccommodationIdAndStatus(UUID accommodationId, RoomStatus status);
    Page<Room> findByAccommodationId(UUID accommodationId, Pageable pageable);

    @Query("select r from Room r where r.accommodationId = :accommodationId "
            + "and (:status is null or r.status = :status) and exists "
            + "(select a.id from Accommodation a where a.id = r.accommodationId and a.partnerId = :partnerId)")
    Page<Room> findOwned(@Param("accommodationId") UUID accommodationId, @Param("partnerId") UUID partnerId,
                         @Param("status") RoomStatus status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :id and r.accommodationId = :accommodationId and exists "
            + "(select a.id from Accommodation a where a.id = r.accommodationId and a.partnerId = :partnerId)")
    Optional<Room> lockOwned(@Param("id") UUID id, @Param("accommodationId") UUID accommodationId,
                              @Param("partnerId") UUID partnerId);
}
