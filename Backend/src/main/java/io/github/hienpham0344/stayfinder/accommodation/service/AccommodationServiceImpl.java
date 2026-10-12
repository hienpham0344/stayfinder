package io.github.hienpham0344.stayfinder.accommodation.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.accommodation.entity.*;
import io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper;
import io.github.hienpham0344.stayfinder.accommodation.repository.*;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.*;
import java.util.*;

@Service
public class AccommodationServiceImpl implements AccommodationService,AccommodationLookup {
    private final AccommodationRepository accommodations;
    private final ImageRepository images;
    private final AccommodationFeatureRepository links;
    private final FeatureRepository features;
    private final AccommodationMapper mapper;
    private final AccommodationSearchRepository search;
    private final UserRepository users;
    private final Clock clock;
    public AccommodationServiceImpl(AccommodationRepository accommodations,ImageRepository images,AccommodationFeatureRepository links,
            FeatureRepository features,AccommodationMapper mapper,AccommodationSearchRepository search,UserRepository users,Clock clock) {
        this.accommodations=accommodations;this.images=images;this.links=links;this.features=features;this.mapper=mapper;
        this.search=search;this.users=users;this.clock=clock;
    }
    @Override @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public PageResponse<StayCardResponse> search(AccommodationSearchRequest request,Pageable page) {
        request.validateAndNormalize();
        if(page.getPageNumber()<0||page.getPageSize()<1||page.getPageSize()>100)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        return search.search(request,page,viewerId(),clock.instant());
    }
    @Override @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public StayDetailResponse get(UUID id) {
        var row=accommodations.findById(id).filter(a->a.getStatus()==AccommodationStatus.ACTIVE)
            .orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        var card=search.findCard(id,viewerId(),clock.instant())
            .orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        if(row.getCleaningFeeCents()==null||row.getServiceFeeCents()==null||row.getTimezone()==null)
            throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        try {ZoneId.of(row.getTimezone());}
        catch(DateTimeException exception){throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
        List<String> urls=images.findByAccommodationId(id).stream().sorted(Comparator.comparing(Image::getId))
            .map(Image::getUrl).filter(Objects::nonNull).toList();
        List<UUID> ids=links.findByIdAccommodationId(id).stream().map(AccommodationFeature::getId)
            .map(AccommodationFeatureId::getFeaturesId).toList();
        List<AmenityDto> amenities=features.findAllById(ids).stream().map(mapper::toAmenity)
            .sorted(Comparator.comparing(AmenityDto::name).thenComparing(AmenityDto::id)).toList();
        HostResponse host=row.getPartnerId()==null?null:users.findById(row.getPartnerId())
            .filter(u->u.getFullName()!=null&&!u.getFullName().isBlank())
            .map(u->new HostResponse(u.getId(),u.getFullName(),u.getAvatarUrl())).orElse(null);
        return new StayDetailResponse(card.id(),card.name(),card.typeId(),card.typeName(),card.city(),card.address(),card.latitude(),card.longitude(),
            card.nightlyPrice(),card.coverImageUrl(),card.ratingAverage(),card.reviewCount(),card.isFavorite(),row.getDescription(),row.getTimezone(),
            urls,amenities,MoneyUsd.cents(row.getCleaningFeeCents()),MoneyUsd.cents(row.getServiceFeeCents()),
            row.getBedrooms(),row.getBeds(),row.getBaths(),host);
    }
    @Override @Transactional(readOnly=true)
    public Optional<AccommodationBookingView> findBookingView(UUID id) {
        return accommodations.findById(id).filter(a->a.getStatus()==AccommodationStatus.ACTIVE)
            .map(a->new AccommodationBookingView(a.getId(),a.getBasePrice()));
    }
    private static UUID viewerId() {
        var authentication=SecurityContextHolder.getContext().getAuthentication();
        return authentication!=null&&authentication.isAuthenticated()&&authentication.getPrincipal() instanceof CurrentUser user?user.id():null;
    }
}
