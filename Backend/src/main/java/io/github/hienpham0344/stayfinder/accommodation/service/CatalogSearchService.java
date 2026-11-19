package io.github.hienpham0344.stayfinder.accommodation.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationSearch;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationSearchRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;

@Service
public class CatalogSearchService {
    private final AccommodationSearchRepository repository;
    private final Clock clock;
    public CatalogSearchService(AccommodationSearchRepository repository, Clock clock) {
        this.repository = repository; this.clock = clock;
    }
    @Transactional(readOnly = true)
    public Page<AccommodationResponse> search(AccommodationSearch request, Pageable page) {
        request.validate(clock);
        return repository.search(request, page, clock.instant());
    }
}
