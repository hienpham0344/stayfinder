package io.github.hienpham0344.stayfinder.favorite;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationBookingView;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.favorite.entity.Favorite;
import io.github.hienpham0344.stayfinder.favorite.mapper.FavoriteMapper;
import io.github.hienpham0344.stayfinder.favorite.repository.FavoriteRepository;
import io.github.hienpham0344.stayfinder.favorite.service.FavoriteServiceImpl;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class FavoriteServiceTest {
    private final FavoriteRepository favoriteRepository = mock(FavoriteRepository.class);
    private final AccommodationLookup accommodationLookup = mock(AccommodationLookup.class);
    private final FavoriteServiceImpl service = new FavoriteServiceImpl(favoriteRepository, accommodationLookup,
            Mappers.getMapper(FavoriteMapper.class));

    @AfterEach
    void clearSecurityContext() { SecurityContextHolder.clearContext(); }

    @Test
    void addingAnExistingFavoriteIsIdempotent() {
        UUID userId = UUID.randomUUID();
        UUID accommodationId = UUID.randomUUID();
        authenticate(userId);
        Favorite existing = new Favorite();
        existing.setId(UUID.randomUUID());
        existing.setUserId(userId);
        existing.setAccommodationId(accommodationId);
        when(accommodationLookup.findBookingView(accommodationId))
                .thenReturn(Optional.of(new AccommodationBookingView(accommodationId, null)));
        when(favoriteRepository.findByUserIdAndAccommodationId(userId, accommodationId)).thenReturn(Optional.of(existing));

        assertEquals(existing.getId(), service.add(accommodationId).id());
        verify(favoriteRepository, never()).save(any());
    }

    private void authenticate(UUID userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(userId, "user@example.com", UserRole.CUSTOMER), null, List.of()));
    }
}
