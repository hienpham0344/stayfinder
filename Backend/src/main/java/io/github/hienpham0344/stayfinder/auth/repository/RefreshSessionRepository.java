package io.github.hienpham0344.stayfinder.auth.repository;
import io.github.hienpham0344.stayfinder.auth.entity.RefreshSession;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
public interface RefreshSessionRepository extends JpaRepository<RefreshSession,UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from RefreshSession s where s.id=:id")
    Optional<RefreshSession> lockById(@Param("id") UUID id);
    @Modifying @Query("update RefreshSession s set s.revokedAt=:now where s.userId=:userId and s.revokedAt is null")
    void revokeAllForUser(@Param("userId") UUID userId,@Param("now") Instant now);
}
