package io.github.hienpham0344.stayfinder.accommodation.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.FeatureResponse;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationTypeRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.FeatureRepository;
import io.github.hienpham0344.stayfinder.room.repository.RoomTypeRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CatalogMetadataService {
    private final AccommodationTypeRepository types;
    private final FeatureRepository features;
    private final RoomTypeRepository roomTypes;
    public CatalogMetadataService(AccommodationTypeRepository types, FeatureRepository features, RoomTypeRepository roomTypes) {
        this.types = types; this.features = features; this.roomTypes = roomTypes;
    }
    @Cacheable(cacheNames = "catalog-metadata", key = "'all'", sync = true)
    @Transactional(readOnly = true)
    public Metadata get() {
        var page = PageRequest.of(0, 1000, Sort.by("name", "id"));
        return new Metadata(types.findAll(page).map(t -> new FeatureResponse(t.getId(), t.getName())).toList(),
                features.findAll(page).map(f -> new FeatureResponse(f.getId(), f.getName())).toList(),
                roomTypes.findAll(page).map(t -> new FeatureResponse(t.getId(), t.getName())).toList());
    }
    public record Metadata(List<FeatureResponse> types, List<FeatureResponse> features, List<FeatureResponse> roomTypes) { }
}
