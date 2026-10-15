package io.github.hienpham0344.stayfinder.reward.repository;
import io.github.hienpham0344.stayfinder.reward.entity.RewardClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RewardClaimRepository extends JpaRepository<RewardClaim,UUID> {
 @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
 @org.springframework.data.jpa.repository.Query("select e from RewardClaim e where e.id=:id")
 Optional<RewardClaim> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
 Optional<RewardClaim> findByIdAndUserId(UUID id,UUID userId);
 org.springframework.data.domain.Page<RewardClaim> findByUserIdOrderByCreatedAtDescIdDesc(UUID userId,org.springframework.data.domain.Pageable pageable);
}
