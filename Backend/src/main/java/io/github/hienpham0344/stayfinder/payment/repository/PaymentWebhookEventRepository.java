package io.github.hienpham0344.stayfinder.payment.repository;
import io.github.hienpham0344.stayfinder.payment.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;import java.util.*;
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent,UUID>{
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select e from PaymentWebhookEvent e where e.provider=:provider and e.environment=:environment and e.eventId=:eventId")
 Optional<PaymentWebhookEvent> lockNativeEvent(@Param("provider") String provider,@Param("environment") String environment,@Param("eventId") String eventId);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select e from PaymentWebhookEvent e where e.id=:id") Optional<PaymentWebhookEvent> lockById(@Param("id") UUID id);
 @Query("select e.id from PaymentWebhookEvent e where (e.processingStatus='received' or e.conflictCount>e.handledConflictCount) order by e.receivedAt,e.id") List<UUID> findReceivedIds(Pageable page);
}
