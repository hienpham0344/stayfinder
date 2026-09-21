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

    @PutMapping("/{accommodationId}")
    public ResponseEntity<ApiResponse<FavoriteResponse>> add(@PathVariable UUID accommodationId) {
        return ResponseEntity.ok(ApiResponse.success(service.add(accommodationId)));
    }

    @DeleteMapping("/{accommodationId}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable UUID accommodationId) {
        service.remove(accommodationId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
