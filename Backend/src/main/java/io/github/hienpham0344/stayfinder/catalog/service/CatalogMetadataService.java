package io.github.hienpham0344.stayfinder.catalog.service;
import io.github.hienpham0344.stayfinder.catalog.dto.*;
import io.github.hienpham0344.stayfinder.catalog.entity.Location;
import io.github.hienpham0344.stayfinder.catalog.repository.LocationRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.*;
import io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly=true)
public class CatalogMetadataService {
    private final AccommodationTypeRepository types;
    private final FeatureRepository features;
    private final LocationRepository locations;
    private final AccommodationMapper mapper;
    public CatalogMetadataService(AccommodationTypeRepository types,FeatureRepository features,LocationRepository locations,AccommodationMapper mapper) {
        this.types=types;this.features=features;this.locations=locations;this.mapper=mapper;
    }
    public CatalogFiltersResponse filters() {
        var propertyTypes=types.findAll().stream().filter(t->t.getName()!=null&&!t.getName().isBlank())
            .map(t->new CatalogOptionDto(t.getId(),t.getName())).sorted(Comparator.comparing(CatalogOptionDto::name).thenComparing(CatalogOptionDto::id)).toList();
        var amenities=features.findAll().stream().filter(f->f.getName()!=null&&!f.getName().isBlank()).map(mapper::toAmenity)
            .sorted(Comparator.comparing(io.github.hienpham0344.stayfinder.accommodation.dto.AmenityDto::name)
                .thenComparing(io.github.hienpham0344.stayfinder.accommodation.dto.AmenityDto::id)).toList();
        var places=locations.findSuggestions("%",PageRequest.of(0,100)).stream().filter(CatalogMetadataService::knownCity).limit(100)
            .map(CatalogMetadataService::location).toList();
        return new CatalogFiltersResponse(propertyTypes,amenities,places,List.of("recommended","name","price","rating"),90,20,20,10);
    }
    public List<LocationDto> suggestions(String query) {
        String text=query==null?"":query.trim();
        if(text.length()>120)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        return locations.findSuggestions("%"+text+"%",PageRequest.of(0,20)).stream().filter(CatalogMetadataService::knownCity).limit(20)
            .map(CatalogMetadataService::location).toList();
    }
    private static boolean knownCity(Location row){return row.getCity()!=null&&!row.getCity().isBlank();}
    private static LocationDto location(Location row) {
        String country=row.getCountry()==null||row.getCountry().isBlank()?null:row.getCountry();
        return new LocationDto(row.getId(),row.getCity()+(country==null?"":", "+country),row.getCity(),country);
    }
}
