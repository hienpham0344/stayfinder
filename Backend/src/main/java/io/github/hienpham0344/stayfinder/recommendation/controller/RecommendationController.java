package io.github.hienpham0344.stayfinder.recommendation.controller;

import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.recommendation.service.RecommendationService;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
public class RecommendationController {
    private final RecommendationService service;
    public RecommendationController(RecommendationService service) { this.service = service; }
    @GetMapping("/api/recommendations")
    public ApiResponse<List<AccommodationResponse>> recommend(Authentication authentication,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests) {
        UUID userId = authentication != null && authentication.getPrincipal() instanceof CurrentUser user ? user.id() : null;
        return ApiResponse.success(service.recommend(userId,
                new AccommodationSearch(null, null, null, null, null, checkIn, checkOut, guests), limit));
    }
}
