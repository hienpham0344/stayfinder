package io.github.hienpham0344.stayfinder.accommodation;

import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.accommodation.entity.*;
import io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper;
import io.github.hienpham0344.stayfinder.accommodation.repository.*;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationServiceImpl;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AccommodationCatalogServiceTest {
    private final AccommodationRepository accommodations=mock(AccommodationRepository.class);
    private final ImageRepository images=mock(ImageRepository.class);
    private final AccommodationFeatureRepository links=mock(AccommodationFeatureRepository.class);
    private final FeatureRepository features=mock(FeatureRepository.class);
    private final AccommodationSearchRepository read=mock(AccommodationSearchRepository.class);
    private final UserRepository users=mock(UserRepository.class);
    private final AccommodationServiceImpl service=new AccommodationServiceImpl(accommodations,images,links,features,Mappers.getMapper(AccommodationMapper.class),read,users,Clock.systemUTC());
    private final UUID id=UUID.randomUUID(),viewer=UUID.randomUUID();
    private StayCardResponse card(boolean favorite) {
        return new StayCardResponse(id,"Stay",null,null,"Da Nang",null,null,null,MoneyUsd.cents(29900),null,null,0,favorite);
    }
    @AfterEach void clear(){SecurityContextHolder.clearContext();}
    @Test void anonymousCatalogDoesNotLeakAnotherUsersFavoriteState() {
        when(read.search(any(),any(),nullable(UUID.class),any())).thenAnswer(i->new PageResponse<>(
            List.of(card(viewer.equals(i.getArgument(2)))),0,20,1,1));
        var anonymous=service.search(new AccommodationSearchRequest(),PageRequest.of(0,20));
        assertEquals(1,anonymous.items().size());assertFalse(anonymous.items().getFirst().isFavorite());
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
            new CurrentUser(viewer,"viewer@example.com",UserRole.CUSTOMER),null,List.of()));
        var personal=service.search(new AccommodationSearchRequest(),PageRequest.of(0,20));
        assertEquals(1,personal.items().size());assertTrue(personal.items().getFirst().isFavorite());
    }
    @Test void invalidSearchIsRejectedBeforePersistence() {
        var request=new AccommodationSearchRequest();request.setQ("x".repeat(121));
        assertThrows(BusinessException.class,()->service.search(request,PageRequest.of(0,20)));
        verifyNoInteractions(read);
    }
    @Test void detailUsesExplicitUsdAndKeepsUnknownFactsAbsent() {
        var row=new Accommodation();row.setId(id);row.setStatus(AccommodationStatus.ACTIVE);row.setTimezone("Asia/Bangkok");
        row.setBasePrice(new BigDecimal("2000000"));row.setCleaningFeeCents(2500L);row.setServiceFeeCents(1000L);
        when(accommodations.findById(id)).thenReturn(Optional.of(row));when(read.findCard(eq(id),nullable(UUID.class),any())).thenReturn(Optional.of(card(false)));
        when(images.findByAccommodationId(id)).thenReturn(List.of());when(links.findByIdAccommodationId(id)).thenReturn(List.of());
        var result=assertDoesNotThrow(()->service.get(id));assertNotNull(result);
        assertEquals(29900,result.nightlyPrice().amountCents());assertEquals(2500,result.cleaningFee().amountCents());
        assertNull(result.host());assertNull(result.bedrooms());assertNull(result.ratingAverage());assertEquals(0,result.reviewCount());
    }
    @Test void unclassifiedLegacyPriceCannotBecomeAUsdDetailOrBookingTarget() {
        var row=new Accommodation();row.setId(id);row.setStatus(AccommodationStatus.INACTIVE);row.setBasePrice(new BigDecimal("2000000"));
        when(accommodations.findById(id)).thenReturn(Optional.of(row));
        assertThrows(BusinessException.class,()->service.get(id));
        assertTrue(service.findBookingView(id).isEmpty());
    }
}
