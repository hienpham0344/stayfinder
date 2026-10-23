package io.github.hienpham0344.stayfinder.common.idempotency;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface IdempotencyRepository extends JpaRepository<IdempotencyRecord,UUID> {
 Optional<IdempotencyRecord> findByUserIdAndOperationAndRequestKey(UUID userId,String operation,String requestKey);
}
