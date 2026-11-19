package io.github.hienpham0344.stayfinder.rewards.repository;
import io.github.hienpham0344.stayfinder.rewards.entity.RewardCatalog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface RewardCatalogRepository extends JpaRepository<RewardCatalog, UUID> {
    Page<RewardCatalog> findByEnabledTrue(Pageable pageable);
}
