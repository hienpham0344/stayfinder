package io.github.hienpham0344.stayfinder.user.repository;

import io.github.hienpham0344.stayfinder.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from User u where u.id=:id")
    Optional<User> lockById(@org.springframework.data.repository.query.Param("id") UUID id);

    @org.springframework.data.jpa.repository.Query("select u from User u where lower(trim(u.email)) = lower(trim(:email))")
    Optional<User> findByEmailIgnoreCase(@org.springframework.data.repository.query.Param("email") String email);
}
