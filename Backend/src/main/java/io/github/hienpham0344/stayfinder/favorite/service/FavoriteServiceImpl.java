package io.github.hienpham0344.stayfinder.favorite.service;
import io.github.hienpham0344.stayfinder.favorite.dto.*;
import io.github.hienpham0344.stayfinder.favorite.entity.Favorite;
import io.github.hienpham0344.stayfinder.favorite.repository.FavoriteRepository;
import io.github.hienpham0344.stayfinder.favorite.mapper.FavoriteMapper;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationSearchRepository;
import io.github.hienpham0344.stayfinder.auth.service.AuthServiceImpl;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.Clock;
import java.util.UUID;

@Service
public class FavoriteServiceImpl implements FavoriteService {
    private final FavoriteRepository favorites;
    private final AccommodationLookup accommodations;
    private final FavoriteMapper mapper;
    private final UserRepository users;
    private final AccommodationSearchRepository read;
    private final Clock clock;
    public FavoriteServiceImpl(FavoriteRepository favorites,AccommodationLookup accommodations,FavoriteMapper mapper,
            UserRepository users,AccommodationSearchRepository read,Clock clock) {
        this.favorites=favorites;this.accommodations=accommodations;this.mapper=mapper;this.users=users;this.read=read;this.clock=clock;
    }
    @Override @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public PageResponse<FavoriteCardResponse> list(Pageable page) {
        if(page.getPageNumber()<0||page.getPageSize()<1||page.getPageSize()>100)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        return read.favorites(page,CurrentUser.require().id(),clock.instant());
    }
    @Override @Transactional
    public FavoriteResponse add(UUID id) {
        UUID owner=CurrentUser.require().id();lockOwner(owner);
        if(accommodations.findBookingView(id).isEmpty())throw new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND);
        Favorite favorite=favorites.findByUserIdAndAccommodationId(owner,id).orElseGet(()->{
            Favorite created=new Favorite();created.setUserId(owner);created.setAccommodationId(id);return favorites.save(created);
        });
        return mapper.toResponse(favorite);
    }
    @Override @Transactional
    public void remove(UUID id) {
        UUID owner=CurrentUser.require().id();lockOwner(owner);
        favorites.findByUserIdAndAccommodationId(owner,id).ifPresent(favorites::delete);
    }
    private void lockOwner(UUID id) {
        users.lockById(id).filter(AuthServiceImpl::active).orElseThrow(()->new BusinessException(ErrorCode.UNAUTHORIZED));
    }
}
