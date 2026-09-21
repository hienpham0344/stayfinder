package io.github.hienpham0344.stayfinder.favorite.mapper;

import io.github.hienpham0344.stayfinder.favorite.dto.FavoriteResponse;
import io.github.hienpham0344.stayfinder.favorite.entity.Favorite;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FavoriteMapper {
    FavoriteResponse toResponse(Favorite entity);
}
