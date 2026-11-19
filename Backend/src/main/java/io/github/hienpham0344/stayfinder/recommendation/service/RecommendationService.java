package io.github.hienpham0344.stayfinder.recommendation.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.accommodation.service.CatalogSearchService;
import io.github.hienpham0344.stayfinder.recommendation.repository.RecommendationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;

@Service
public class RecommendationService {
    private final CatalogSearchService search;
    private final RecommendationRepository repository;
    public RecommendationService(CatalogSearchService search, RecommendationRepository repository) {
        this.search = search; this.repository = repository;
    }
    @Transactional(readOnly = true)
    public List<AccommodationResponse> recommend(UUID userId, AccommodationSearch filter, int limit) {
        List<AccommodationResponse> candidates = search.search(filter,
                PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        List<RecommendationRepository.Preference> preferences = repository.preferences(userId);
        Set<UUID> types = new HashSet<>();
        List<BigDecimal> prices = new ArrayList<>();
        for (var item : preferences) {
            if (item.typeId() != null) types.add(item.typeId());
            if (item.price() != null && item.price().signum() > 0) prices.add(item.price());
        }
        prices.sort(Comparator.naturalOrder());
        BigDecimal median = prices.isEmpty() ? null : prices.get(prices.size() / 2);
        Set<UUID> ids = new HashSet<>();
        candidates.forEach(item -> ids.add(item.id())); preferences.forEach(item -> ids.add(item.id()));
        Map<UUID, Set<UUID>> features = repository.features(ids);
        Set<UUID> preferredFeatures = new HashSet<>();
        preferences.forEach(item -> preferredFeatures.addAll(features.getOrDefault(item.id(), Set.of())));
        var ratings = repository.ratings(candidates.stream().map(AccommodationResponse::id).toList());
        Comparator<AccommodationResponse> order = Comparator
                .comparingInt((AccommodationResponse item) -> score(item, types, preferredFeatures, median, features)).reversed()
                .thenComparing(Comparator.comparingDouble((AccommodationResponse item) ->
                        ratings.getOrDefault(item.id(), new RecommendationRepository.Rating(0, 0)).average()).reversed())
                .thenComparing(Comparator.comparingLong((AccommodationResponse item) ->
                        ratings.getOrDefault(item.id(), new RecommendationRepository.Rating(0, 0)).count()).reversed())
                .thenComparing(AccommodationResponse::id);
        return candidates.stream().sorted(order).limit(Math.min(20, Math.max(1, limit))).toList();
    }
    private int score(AccommodationResponse item, Set<UUID> types, Set<UUID> wanted, BigDecimal median,
                      Map<UUID, Set<UUID>> features) {
        int score = types.contains(item.typeId()) ? 3 : 0;
        score += 2 * (int) features.getOrDefault(item.id(), Set.of()).stream().filter(wanted::contains).count();
        if (median != null && item.matchedPrice() != null
                && item.matchedPrice().subtract(median).abs().compareTo(median.multiply(new BigDecimal("0.25"))) <= 0) score++;
        return score;
    }
}
