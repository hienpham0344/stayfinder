package io.github.hienpham0344.stayfinder.favorite.controller;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.favorite.dto.FavoriteResponse;
import io.github.hienpham0344.stayfinder.favorite.service.FavoriteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    private final FavoriteService service;

    public FavoriteController(FavoriteService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FavoriteResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(service.list()));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<FavoriteResponse>>> page(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size) {
        var paging = org.springframework.data.domain.PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)),
                org.springframework.data.domain.Sort.by("id"));
        return ResponseEntity.ok(ApiResponse.success(service.page(paging)));
    }

    @PutMapping("/{accommodationId}")
    public ResponseEntity<ApiResponse<FavoriteResponse>> add(@PathVariable UUID accommodationId) {
        return ResponseEntity.ok(ApiResponse.success(service.add(accommodationId)));
    }

    @GetMapping("/accommodations")
    public ApiResponse<org.springframework.data.domain.Page<io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse>> accommodations(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.accommodations(io.github.hienpham0344.stayfinder.common.validation.Paging.newest(page, size)));
    }

    @DeleteMapping("/{accommodationId}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable UUID accommodationId) {
        service.remove(accommodationId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
