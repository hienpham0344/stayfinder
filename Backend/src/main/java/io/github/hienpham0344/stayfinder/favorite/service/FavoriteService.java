package io.github.hienpham0344.stayfinder.favorite.service;

import io.github.hienpham0344.stayfinder.favorite.dto.FavoriteResponse;

import java.util.List;
import java.util.UUID;

public interface FavoriteService {
    List<FavoriteResponse> list();
    org.springframework.data.domain.Page<FavoriteResponse> page(org.springframework.data.domain.Pageable page);
    org.springframework.data.domain.Page<io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse> accommodations(org.springframework.data.domain.Pageable page);
    FavoriteResponse add(UUID accommodationId);
    void remove(UUID accommodationId);
}
