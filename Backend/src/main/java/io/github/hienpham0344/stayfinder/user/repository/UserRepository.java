package io.github.hienpham0344.stayfinder.user.repository;

import io.github.hienpham0344.stayfinder.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
}
