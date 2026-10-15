package io.github.hienpham0344.stayfinder.reward.repository;
import io.github.hienpham0344.stayfinder.reward.entity.RewardLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RewardLedgerEntryRepository extends JpaRepository<RewardLedgerEntry,UUID> {

 Optional<RewardLedgerEntry> findByUserIdAndSourceKey(UUID userId,String sourceKey);
 org.springframework.data.domain.Page<RewardLedgerEntry> findByUserIdOrderByCreatedAtDescIdDesc(UUID userId,org.springframework.data.domain.Pageable pageable);
}
