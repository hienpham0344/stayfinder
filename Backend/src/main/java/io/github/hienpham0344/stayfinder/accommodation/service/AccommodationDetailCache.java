package io.github.hienpham0344.stayfinder.accommodation.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeature;
import io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper;
import io.github.hienpham0344.stayfinder.accommodation.repository.*;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import java.util.List;
import java.util.UUID;

/** Caches DTOs only; the caller must first read the current ACTIVE entity/version. */
@Service
public class AccommodationDetailCache {
    private final ImageRepository images;
    private final AccommodationFeatureRepository links;
    private final FeatureRepository features;
    private final AccommodationMapper mapper;
    private final CacheManager caches;
    public AccommodationDetailCache(ImageRepository images, AccommodationFeatureRepository links,
                                    FeatureRepository features, AccommodationMapper mapper, CacheManager caches) {
        this.images = images; this.links = links; this.features = features; this.mapper = mapper; this.caches = caches;
    }
    @Cacheable(cacheNames = "accommodation-detail", key = "#accommodation.id.toString() + ':' + #accommodation.version", sync = true)
    public AccommodationDetailResponse load(Accommodation accommodation) {
        UUID id = accommodation.getId();
        List<UUID> ids = links.findByIdAccommodationId(id).stream().map(AccommodationFeature::getId)
                .map(key -> key.getFeaturesId()).toList();
        return new AccommodationDetailResponse(mapper.toResponse(accommodation),
                images.findByAccommodationId(id).stream().map(mapper::toImageResponse).toList(),
                features.findAllById(ids).stream().map(mapper::toFeatureResponse).toList());
    }
    @TransactionalEventListener
    public void invalidate(AccommodationChanged event) {
        if (caches.getCache("accommodation-detail") instanceof CaffeineCache cache) {
            String prefix = event.accommodationId() + ":";
            cache.getNativeCache().asMap().keySet().removeIf(key -> key.toString().startsWith(prefix));
        }
    }
}
