package io.github.hienpham0344.stayfinder.favorite.dto;
import io.github.hienpham0344.stayfinder.accommodation.dto.StayCardResponse;
import java.util.UUID;
public record FavoriteCardResponse(UUID favoriteId,StayCardResponse accommodation) {}
