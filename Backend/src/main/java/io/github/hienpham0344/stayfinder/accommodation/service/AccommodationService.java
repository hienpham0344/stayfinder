package io.github.hienpham0344.stayfinder.accommodation.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationDetailResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AccommodationService {
    Page<AccommodationResponse> list(Pageable pageable);
    AccommodationDetailResponse get(UUID id);
}
