package io.github.hienpham0344.stayfinder.media.repository;
import io.github.hienpham0344.stayfinder.media.entity.MediaAsset;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import org.springframework.data.domain.Pageable;import jakarta.persistence.LockModeType;import java.util.*;import java.time.Instant;
public interface MediaAssetRepository extends JpaRepository<MediaAsset,UUID>{
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select a from MediaAsset a where a.id=:id")Optional<MediaAsset> lockById(@Param("id")UUID id);
 List<MediaAsset> findByReviewId(UUID reviewId);
 List<MediaAsset> findByReviewIdIsNullAndUnattachedSinceBeforeOrderByUnattachedSinceAsc(Instant before,Pageable pageable);
}
