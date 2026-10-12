package io.github.hienpham0344.stayfinder.favorite;
import io.github.hienpham0344.stayfinder.accommodation.service.*;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationSearchRepository;
import io.github.hienpham0344.stayfinder.accommodation.dto.StayCardResponse;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.favorite.dto.FavoriteCardResponse;
import io.github.hienpham0344.stayfinder.favorite.entity.Favorite;
import io.github.hienpham0344.stayfinder.favorite.mapper.FavoriteMapper;
import io.github.hienpham0344.stayfinder.favorite.repository.FavoriteRepository;
import io.github.hienpham0344.stayfinder.favorite.service.FavoriteServiceImpl;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.Clock;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FavoriteServiceTest {
    private final FavoriteRepository favorites=mock(FavoriteRepository.class);
    private final AccommodationLookup accommodations=mock(AccommodationLookup.class);
    private final AccommodationSearchRepository read=mock(AccommodationSearchRepository.class);
    private final UserRepository users=mock(UserRepository.class);
    private final FavoriteServiceImpl service=new FavoriteServiceImpl(favorites,accommodations,Mappers.getMapper(FavoriteMapper.class),users,read,Clock.systemUTC());
    private final Map<String,Favorite> rows=new HashMap<>();
    private final UUID actor=UUID.randomUUID(),stay=UUID.randomUUID();
    private String key(UUID user,UUID property){return user+":"+property;}
    @BeforeEach void setup() {
        authenticate(actor);User user=new User();user.setId(actor);user.setRole(UserRole.CUSTOMER);user.setCredentialState("active");user.setPasswordHash("test-hash");
        when(users.lockById(any())).thenReturn(Optional.of(user));
        when(accommodations.findBookingView(stay)).thenReturn(Optional.of(new AccommodationBookingView(stay,null)));
        when(favorites.findByUserIdAndAccommodationId(any(),any())).thenAnswer(i->Optional.ofNullable(rows.get(key(i.getArgument(0),i.getArgument(1)))));
        when(favorites.save(any())).thenAnswer(i->{Favorite f=i.getArgument(0);if(f.getId()==null)f.setId(UUID.randomUUID());rows.put(key(f.getUserId(),f.getAccommodationId()),f);return f;});
        doAnswer(i->{Favorite f=i.getArgument(0);rows.remove(key(f.getUserId(),f.getAccommodationId()));return null;}).when(favorites).delete(any());
        when(read.favorites(any(),any(),any())).thenAnswer(i->{
            UUID owner=i.getArgument(1);var items=rows.values().stream().filter(f->owner.equals(f.getUserId())).map(f->new FavoriteCardResponse(f.getId(),
                new StayCardResponse(f.getAccommodationId(),"Stay",null,null,"Da Nang",null,null,null,MoneyUsd.cents(29900),null,null,0,true))).toList();
            return new PageResponse<>(items,0,20,items.size(),items.isEmpty()?0:1);
        });
    }
    @AfterEach void clear(){SecurityContextHolder.clearContext();}
    private void authenticate(UUID id){SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new CurrentUser(id,"user@example.com",UserRole.CUSTOMER),null,List.of()));}
    @Test void repeatedAddReturnsTheSameFavoriteAndOneStoredRow() {
        var first=service.add(stay);var next=service.add(stay);assertEquals(first.id(),next.id());assertEquals(1,rows.size());
        verify(users,atLeastOnce()).lockById(actor);
    }
    @Test void unavailableAccommodationFailsBeforeAnyFavoriteWrite() {
        when(accommodations.findBookingView(stay)).thenReturn(Optional.empty());
        assertThrows(BusinessException.class,()->service.add(stay));assertTrue(rows.isEmpty());
    }
    @Test void listAndDeleteRemainOwnerScopedAndAbsentDeleteSucceeds() {
        service.add(stay);authenticate(UUID.randomUUID());
        assertEquals(0,service.list(PageRequest.of(0,20)).items().size());service.remove(stay);assertEquals(1,rows.size());
        authenticate(actor);var mine=service.list(PageRequest.of(0,20));assertEquals(1,mine.items().size());
        assertEquals(stay,mine.items().getFirst().accommodation().id());service.remove(stay);service.remove(stay);assertTrue(rows.isEmpty());
    }
}
