package io.github.hienpham0344.stayfinder.accommodation.service;
import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
import java.util.UUID;
public interface AccommodationService {
    PageResponse<StayCardResponse> search(AccommodationSearchRequest request,Pageable page);
    StayDetailResponse get(UUID id);
}
