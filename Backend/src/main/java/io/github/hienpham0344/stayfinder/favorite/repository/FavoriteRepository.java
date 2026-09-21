package io.github.hienpham0344.stayfinder.favorite.repository;

import io.github.hienpham0344.stayfinder.favorite.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {
    List<Favorite> findByUserId(UUID userId);
    Optional<Favorite> findByUserIdAndAccommodationId(UUID userId, UUID accommodationId);
}
