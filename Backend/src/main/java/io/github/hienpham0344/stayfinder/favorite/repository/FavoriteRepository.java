package io.github.hienpham0344.stayfinder.favorite.repository;

import io.github.hienpham0344.stayfinder.favorite.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {
    @org.springframework.data.jpa.repository.Query("select a from Accommodation a, Favorite f where f.accommodationId=a.id and f.userId=:userId and a.status=io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus.ACTIVE")
    org.springframework.data.domain.Page<io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation> accommodations(
            @org.springframework.data.repository.query.Param("userId") UUID userId, org.springframework.data.domain.Pageable page);
    org.springframework.data.domain.Page<Favorite> findByUserId(UUID userId, org.springframework.data.domain.Pageable page);
    List<Favorite> findByUserId(UUID userId);
    Optional<Favorite> findByUserIdAndAccommodationId(UUID userId, UUID accommodationId);
}
