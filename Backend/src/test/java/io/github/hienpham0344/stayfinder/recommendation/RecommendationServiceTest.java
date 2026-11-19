package io.github.hienpham0344.stayfinder.recommendation;

import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.accommodation.service.CatalogSearchService;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.recommendation.repository.RecommendationRepository;
import io.github.hienpham0344.stayfinder.recommendation.service.RecommendationService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

class RecommendationServiceTest {
    private final CatalogSearchService search = mock(CatalogSearchService.class);
    private final RecommendationRepository data = mock(RecommendationRepository.class);
    private final RecommendationService service = new RecommendationService(search, data);
    private final UUID user = UUID.randomUUID(), preferredType = UUID.randomUUID(), feature = UUID.randomUUID();
    private final AccommodationSearch filter = new AccommodationSearch(null, null, null, null, null, null, null, 2);

    @Test
    void userPreferencesRankMatchingTypeAmenitiesAndPriceBeforeGenericRatings() {
        UUID visited = UUID.randomUUID();
        AccommodationResponse match = stay(UUID.randomUUID(), preferredType);
        AccommodationResponse generic = stay(UUID.randomUUID(), UUID.randomUUID());
        when(search.search(any(), any())).thenReturn(new PageImpl<>(List.of(generic, match)));
        when(data.preferences(user)).thenReturn(List.of(new RecommendationRepository.Preference(visited, preferredType, new BigDecimal("100000"))));
        when(data.features(any())).thenReturn(Map.of(visited, Set.of(feature), match.id(), Set.of(feature)));
        when(data.ratings(any())).thenReturn(Map.of(generic.id(), new RecommendationRepository.Rating(5, 100)));
        assertEquals(match.id(), service.recommend(user, filter, 1).get(0).id());
        verify(data).preferences(user);
        verify(data, times(1)).features(any());
        verify(data, times(1)).ratings(any());
    }

    @Test
    void newUsersUseRatingThenReviewCountAndStableIds() {
        AccommodationResponse first = stay(UUID.randomUUID(), preferredType);
        AccommodationResponse popular = stay(UUID.randomUUID(), preferredType);
        when(search.search(any(), any())).thenReturn(new PageImpl<>(List.of(first, popular)));
        when(data.preferences(null)).thenReturn(List.of());
        when(data.features(any())).thenReturn(Map.of());
        when(data.ratings(any())).thenReturn(Map.of(first.id(), new RecommendationRepository.Rating(4, 2),
                popular.id(), new RecommendationRepository.Rating(4, 10)));
        assertEquals(popular.id(), service.recommend(null, filter, 10).get(0).id());
        assertEquals(service.recommend(null, filter, 10), service.recommend(null, filter, 10));
    }

    private AccommodationResponse stay(UUID id, UUID type) {
        return new AccommodationResponse(id, "Stay", "Hà Nội", null, null, null, new BigDecimal("100000"),
                AccommodationStatus.ACTIVE, type, UUID.randomUUID(), new BigDecimal("100000"));
    }
}
