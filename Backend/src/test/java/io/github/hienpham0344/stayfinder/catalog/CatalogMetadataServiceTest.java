package io.github.hienpham0344.stayfinder.catalog;
import io.github.hienpham0344.stayfinder.catalog.entity.Location;
import io.github.hienpham0344.stayfinder.catalog.repository.LocationRepository;
import io.github.hienpham0344.stayfinder.catalog.service.CatalogMetadataService;
import io.github.hienpham0344.stayfinder.accommodation.entity.*;
import io.github.hienpham0344.stayfinder.accommodation.repository.*;
import io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CatalogMetadataServiceTest {
    private final AccommodationTypeRepository types=mock(AccommodationTypeRepository.class);
    private final FeatureRepository features=mock(FeatureRepository.class);
    private final LocationRepository locations=mock(LocationRepository.class);
    private final CatalogMetadataService service=new CatalogMetadataService(types,features,locations,Mappers.getMapper(AccommodationMapper.class));
    @Test void filtersExposeStoredIdsAndUnknownIconsWithoutInventedFacts() {
        AccommodationType type=new AccommodationType();type.setId(UUID.randomUUID());type.setName("Apartment");
        Feature feature=new Feature();feature.setId(UUID.randomUUID());feature.setName("Wi-Fi");
        Location location=new Location();location.setId(UUID.randomUUID());location.setCity("Da Nang");
        when(types.findAll()).thenReturn(List.of(type));when(features.findAll()).thenReturn(List.of(feature));
        when(locations.findSuggestions(anyString(),any())).thenReturn(List.of(location));
        var result=service.filters();assertEquals(1,result.propertyTypes().size());assertEquals(type.getId(),result.propertyTypes().getFirst().id());
        assertNull(result.amenities().getFirst().iconKey());assertEquals("Da Nang",result.locations().getFirst().label());
        assertNull(result.locations().getFirst().country());assertTrue(result.sorts().contains("price"));
    }
    @Test void oversizedSuggestionQueriesFailBeforePersistence() {
        assertThrows(BusinessException.class,()->service.suggestions("x".repeat(121)));
        verifyNoInteractions(locations);
    }
    @Test void suggestionsRemainBoundedAndDoNotReplaceSourceIds() {
        List<Location> values=new ArrayList<>();
        for(int i=0;i<25;i++){Location l=new Location();l.setId(UUID.randomUUID());l.setCity("City "+i);values.add(l);}
        when(locations.findSuggestions(anyString(),any())).thenReturn(values);
        var result=service.suggestions("City");assertEquals(20,result.size());assertEquals(values.getFirst().getId(),result.getFirst().id());
    }
}
