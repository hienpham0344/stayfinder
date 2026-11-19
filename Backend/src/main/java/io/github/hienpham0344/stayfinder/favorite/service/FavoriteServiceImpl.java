package io.github.hienpham0344.stayfinder.favorite.service;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.favorite.dto.FavoriteResponse;
import io.github.hienpham0344.stayfinder.favorite.entity.Favorite;
import io.github.hienpham0344.stayfinder.favorite.mapper.FavoriteMapper;
import io.github.hienpham0344.stayfinder.favorite.repository.FavoriteRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FavoriteServiceImpl implements FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final AccommodationLookup accommodationLookup;
    private final FavoriteMapper mapper;
    private final io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper accommodationMapper;

    public FavoriteServiceImpl(FavoriteRepository favoriteRepository, AccommodationLookup accommodationLookup,
                               FavoriteMapper mapper, io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper accommodationMapper) {
        this.favoriteRepository = favoriteRepository;
        this.accommodationLookup = accommodationLookup;
        this.mapper = mapper;
        this.accommodationMapper = accommodationMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FavoriteResponse> list() {
        return favoriteRepository.findByUserId(CurrentUser.require().id()).stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional
    public FavoriteResponse add(UUID accommodationId) {
        UUID userId = CurrentUser.require().id();
        if (accommodationLookup.findBookingView(accommodationId).isEmpty()) {
            throw new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND);
        }
        Favorite favorite = favoriteRepository.findByUserIdAndAccommodationId(userId, accommodationId)
                .orElseGet(() -> {
                    Favorite created = new Favorite();
                    created.setUserId(userId);
                    created.setAccommodationId(accommodationId);
                    return favoriteRepository.save(created);
                });
        return mapper.toResponse(favorite);
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<FavoriteResponse> page(org.springframework.data.domain.Pageable page) {
        return favoriteRepository.findByUserId(CurrentUser.require().id(), page).map(mapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse> accommodations(org.springframework.data.domain.Pageable page) {
        return favoriteRepository.accommodations(CurrentUser.require().id(), page).map(accommodationMapper::toResponse);
    }

    @Override
    @Transactional
    public void remove(UUID accommodationId) {
        favoriteRepository.findByUserIdAndAccommodationId(CurrentUser.require().id(), accommodationId)
                .ifPresent(favoriteRepository::delete);
    }
}
