package io.github.hienpham0344.stayfinder.rewards.repository;
import io.github.hienpham0344.stayfinder.rewards.entity.RewardLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface RewardLedgerRepository extends JpaRepository<RewardLedger, UUID> {
    Optional<RewardLedger> findByUserIdAndIdempotencyKey(UUID userId, String key);
    Page<RewardLedger> findByUserId(UUID userId, Pageable pageable);
}
