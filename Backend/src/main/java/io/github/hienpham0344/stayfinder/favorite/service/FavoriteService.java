package io.github.hienpham0344.stayfinder.favorite.service;

import io.github.hienpham0344.stayfinder.favorite.dto.FavoriteResponse;

import java.util.List;
import java.util.UUID;

public interface FavoriteService {
    List<FavoriteResponse> list();
    FavoriteResponse add(UUID accommodationId);
    void remove(UUID accommodationId);
}
