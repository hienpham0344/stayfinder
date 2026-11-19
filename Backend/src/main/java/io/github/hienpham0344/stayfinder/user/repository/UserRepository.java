package io.github.hienpham0344.stayfinder.user.repository;

import io.github.hienpham0344.stayfinder.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    @Query(value = "select * from users where lower(btrim(email)) = lower(btrim(:email))", nativeQuery = true)
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> lockById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.enabled = true and u.role = io.github.hienpham0344.stayfinder.common.enums.UserRole.ADMIN order by u.id")
    List<User> findEnabledAdminsForUpdate();
}
