package io.github.hienpham0344.stayfinder.partner.controller;

import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.partner.service.PartnerPropertyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/partner/accommodations")
@PreAuthorize("hasRole('PARTNER')")
public class PartnerPropertyController {
    private final PartnerPropertyService service;

    public PartnerPropertyController(PartnerPropertyService service) { this.service = service; }

    @GetMapping
    public ApiResponse<Page<ManagementViews.Accommodation>> list(@RequestParam(required = false) AccommodationStatus status,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.list(status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ManagementViews.PropertyDetail> get(@PathVariable UUID id) {
        return ApiResponse.success(service.get(id));
    }

    @PostMapping
    public ApiResponse<ManagementViews.PropertyDetail> create(@Valid @RequestBody ManagementRequests.AccommodationWrite request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ManagementViews.PropertyDetail> update(@PathVariable UUID id,
            @Valid @RequestBody ManagementRequests.AccommodationWrite request) {
        return ApiResponse.success(service.update(id, request));
    }

    @PostMapping("/{id}/deactivate")
    public ApiResponse<ManagementViews.Accommodation> deactivate(@PathVariable UUID id,
            @Valid @RequestBody ManagementRequests.VersionRequest request) {
        return ApiResponse.success(service.deactivate(id, request));
    }

    @GetMapping("/{id}/rooms")
    public ApiResponse<Page<ManagementViews.Room>> rooms(@PathVariable UUID id,
            @RequestParam(required = false) RoomStatus status, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.rooms(id, status, page, size));
    }

    @PostMapping("/{id}/rooms")
    public ApiResponse<ManagementViews.Room> createRoom(@PathVariable UUID id,
            @Valid @RequestBody ManagementRequests.RoomWrite request) {
        return ApiResponse.success(service.createRoom(id, request));
    }

    @PutMapping("/{id}/rooms/{roomId}")
    public ApiResponse<ManagementViews.Room> updateRoom(@PathVariable UUID id, @PathVariable UUID roomId,
            @Valid @RequestBody ManagementRequests.RoomWrite request) {
        return ApiResponse.success(service.updateRoom(id, roomId, request));
    }

    @PostMapping("/{id}/rooms/{roomId}/deactivate")
    public ApiResponse<ManagementViews.Room> deactivateRoom(@PathVariable UUID id, @PathVariable UUID roomId,
            @Valid @RequestBody ManagementRequests.VersionRequest request) {
        return ApiResponse.success(service.deactivateRoom(id, roomId, request));
    }
}
