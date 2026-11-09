package io.github.hienpham0344.stayfinder.room.repository;

import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :id")
    Optional<Room> lockById(@Param("id") UUID id);

    List<Room> findByAccommodationIdAndStatus(UUID accommodationId, RoomStatus status);
    Page<Room> findByAccommodationId(UUID accommodationId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select r from Room r where r.id = :id and r.accommodationId = :accommodationId
            and exists (select a.id from Accommodation a
                        where a.id = r.accommodationId and a.partnerId = :partnerId)
            """)
    Optional<Room> lockOwned(@Param("id") UUID id, @Param("accommodationId") UUID accommodationId,
                             @Param("partnerId") UUID partnerId);
}
