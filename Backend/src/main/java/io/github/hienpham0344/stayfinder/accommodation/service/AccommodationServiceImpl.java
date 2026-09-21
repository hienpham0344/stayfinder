package io.github.hienpham0344.stayfinder.accommodation.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationDetailResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.FeatureResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.ImageResponse;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeature;
import io.github.hienpham0344.stayfinder.accommodation.entity.Feature;
import io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationFeatureRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.FeatureRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.ImageRepository;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AccommodationServiceImpl implements AccommodationService, AccommodationLookup {
    private final AccommodationRepository accommodationRepository;
    private final ImageRepository imageRepository;
    private final AccommodationFeatureRepository accommodationFeatureRepository;
    private final FeatureRepository featureRepository;
    private final AccommodationMapper mapper;

    public AccommodationServiceImpl(AccommodationRepository accommodationRepository,
                                     ImageRepository imageRepository,
                                     AccommodationFeatureRepository accommodationFeatureRepository,
                                     FeatureRepository featureRepository,
                                     AccommodationMapper mapper) {
        this.accommodationRepository = accommodationRepository;
        this.imageRepository = imageRepository;
        this.accommodationFeatureRepository = accommodationFeatureRepository;
        this.featureRepository = featureRepository;
        this.mapper = mapper;
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
                .map(item -> new AccommodationBookingView(item.getId(), item.getBasePrice()));
    }

    @Override
    @Transactional(readOnly = true)
    public AccommodationDetailResponse get(UUID id) {
        Accommodation accommodation = accommodationRepository.findById(id)
                .filter(item -> item.getStatus() == null || item.getStatus() == AccommodationStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        List<ImageResponse> images = imageRepository.findByAccommodationId(id).stream()
                .map(mapper::toImageResponse).toList();
        List<UUID> featureIds = accommodationFeatureRepository.findByIdAccommodationId(id).stream()
                .map(AccommodationFeature::getId).map(key -> key.getFeaturesId()).toList();
        List<FeatureResponse> features = featureRepository.findAllById(featureIds).stream()
                .map(mapper::toFeatureResponse).toList();
        return new AccommodationDetailResponse(mapper.toResponse(accommodation), images, features);
    }
}
