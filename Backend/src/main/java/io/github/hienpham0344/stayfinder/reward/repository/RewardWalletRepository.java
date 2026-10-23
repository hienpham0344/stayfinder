package io.github.hienpham0344.stayfinder.reward.repository;
import io.github.hienpham0344.stayfinder.reward.entity.RewardWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RewardWalletRepository extends JpaRepository<RewardWallet,UUID> {
 @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
 @org.springframework.data.jpa.repository.Query("select e from RewardWallet e where e.userId=:id")
 Optional<RewardWallet> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
}
