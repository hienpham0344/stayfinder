package io.github.hienpham0344.stayfinder.notification.repository;
import io.github.hienpham0344.stayfinder.notification.entity.Notification;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import org.springframework.data.domain.*;import jakarta.persistence.LockModeType;import java.time.Instant;import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification,UUID>{
 Page<Notification> findByUserId(UUID userId,Pageable page);Page<Notification> findByUserIdAndReadAtIsNull(UUID userId,Pageable page);
 @Query("select max(n.createdAt) from Notification n where n.userId=:owner")Optional<Instant> latestDelivery(@Param("owner")UUID owner);
 long countByUserIdAndReadAtIsNull(UUID userId);boolean existsBySourceEventIdAndUserId(UUID eventId,UUID userId);
 @Lock(LockModeType.PESSIMISTIC_WRITE)@Query("select n from Notification n where n.id=:id")Optional<Notification> lockById(@Param("id")UUID id);
 @Modifying(flushAutomatically=true,clearAutomatically=true)@Query("update Notification n set n.readAt=:now where n.userId=:owner and n.readAt is null and n.createdAt<=:snapshot")
 int markAllRead(@Param("owner")UUID owner,@Param("snapshot")Instant snapshot,@Param("now")Instant now);
}
