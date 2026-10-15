package io.github.hienpham0344.stayfinder.catalog.dto;
import io.github.hienpham0344.stayfinder.accommodation.dto.AmenityDto;
import java.util.*;
public record CatalogFiltersResponse(List<CatalogOptionDto> propertyTypes,List<AmenityDto> amenities,List<LocationDto> locations,
        List<String> sorts,int maxNights,int maxAdults,int maxChildren,int maxRooms) {
    public CatalogFiltersResponse {propertyTypes=List.copyOf(propertyTypes);amenities=List.copyOf(amenities);locations=List.copyOf(locations);sorts=List.copyOf(sorts);}
}
