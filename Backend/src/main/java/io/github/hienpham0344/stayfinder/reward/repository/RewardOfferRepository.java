package io.github.hienpham0344.stayfinder.reward.repository;
import io.github.hienpham0344.stayfinder.reward.entity.RewardOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RewardOfferRepository extends JpaRepository<RewardOffer,UUID> {
 @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
 @org.springframework.data.jpa.repository.Query("select e from RewardOffer e where e.id=:id")
 Optional<RewardOffer> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
 List<RewardOffer> findByActiveTrueOrderByPointsCostAscIdAsc();
}
