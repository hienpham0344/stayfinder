package io.github.hienpham0344.stayfinder.accommodation.controller;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationDetailResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.room.dto.RoomResponse;
import io.github.hienpham0344.stayfinder.room.service.RoomService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/accommodations")
public class AccommodationController {
    private final AccommodationService accommodationService;
    private final RoomService roomService;

    public AccommodationController(AccommodationService accommodationService, RoomService roomService) {
        this.accommodationService = accommodationService;
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AccommodationResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        int boundedSize = Math.min(Math.max(size, 1), 100);
        String sortProperty = switch (sort) {
            case "name" -> "name";
            case "basePrice" -> "basePrice";
            case "createdAt" -> "createdAt";
            default -> "createdAt";
        };
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(Math.max(page, 0), boundedSize, Sort.by(sortDirection, sortProperty));
        return ResponseEntity.ok(ApiResponse.success(accommodationService.list(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccommodationDetailResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(accommodationService.get(id)));
    }

    @GetMapping("/{id}/rooms")
    public ResponseEntity<ApiResponse<java.util.List<RoomResponse>>> rooms(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests) {
        return ResponseEntity.ok(ApiResponse.success(roomService.listAvailable(id, checkIn, checkOut, guests)));
    }
}
