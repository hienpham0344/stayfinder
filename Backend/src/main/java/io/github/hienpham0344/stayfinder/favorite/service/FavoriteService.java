package io.github.hienpham0344.stayfinder.favorite.service;
import io.github.hienpham0344.stayfinder.favorite.dto.*;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
import java.util.UUID;
public interface FavoriteService {
    PageResponse<FavoriteCardResponse> list(Pageable page);
    FavoriteResponse add(UUID accommodationId);
    void remove(UUID accommodationId);
}
