package io.github.hienpham0344.stayfinder.auth.repository;
import io.github.hienpham0344.stayfinder.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface RefreshTokenRepository extends JpaRepository<RefreshToken,UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from RefreshToken t where t.id=:id")
    Optional<RefreshToken> lockById(@Param("id") UUID id);
}
