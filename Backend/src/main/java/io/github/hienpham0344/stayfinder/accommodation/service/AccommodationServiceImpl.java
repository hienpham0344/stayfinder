package io.github.hienpham0344.stayfinder.accommodation.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationDetailResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationSnapshotRepository;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class AccommodationServiceImpl implements AccommodationService, AccommodationLookup {
    private final AccommodationRepository accommodationRepository;
    private final AccommodationSnapshotRepository accommodationSnapshotRepository;
    private final AccommodationMapper mapper;
    private final AccommodationDetailCache detailCache;

    public AccommodationServiceImpl(AccommodationRepository accommodationRepository,
                                     AccommodationSnapshotRepository accommodationSnapshotRepository,
                                     AccommodationMapper mapper, AccommodationDetailCache detailCache) {
        this.accommodationRepository = accommodationRepository;
        this.accommodationSnapshotRepository = accommodationSnapshotRepository;
        this.mapper = mapper;
        this.detailCache = detailCache;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccommodationResponse> list(Pageable pageable) {
        return accommodationRepository.findByStatus(AccommodationStatus.ACTIVE, pageable).map(mapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccommodationBookingView> findBookingView(UUID accommodationId) {
        return accommodationRepository.findById(accommodationId)
                .filter(item -> item.getStatus() == AccommodationStatus.ACTIVE)
                .map(item -> new AccommodationBookingView(item.getId(), item.getBasePrice(), item.getName(), item.getAddress()));
    }

    @Override
    @Transactional
    public Optional<AccommodationBookingView> findBookingViewForUpdate(UUID accommodationId) {
        return accommodationRepository.findForBooking(accommodationId)
                .filter(item -> item.getStatus() == AccommodationStatus.ACTIVE)
                .map(item -> new AccommodationBookingView(item.getId(), item.getBasePrice(), item.getName(), item.getAddress()));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean snapshotBelongsToAccommodation(UUID snapshotId, UUID accommodationId) {
        return accommodationSnapshotRepository.existsByIdAndAccommodationId(snapshotId, accommodationId);
    }

    @Override
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public AccommodationDetailResponse get(UUID id) {
        // The state/version check and cache-miss metadata reads must share one committed snapshot.
        Accommodation accommodation = accommodationRepository.findById(id)
                .filter(item -> item.getStatus() == AccommodationStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        return detailCache.load(accommodation);
    }
}
