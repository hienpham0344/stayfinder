package io.github.hienpham0344.stayfinder.partner.controller;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.partner.dto.CreatePartnerRoomRequest;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerAccommodationRequest;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerAccommodationResponse;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomDetails;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomOffer;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomResponse;
import io.github.hienpham0344.stayfinder.partner.service.PartnerAccommodationService;
import io.github.hienpham0344.stayfinder.partner.service.PartnerRoomService;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/partner/accommodations")
public class PartnerCatalogController {
    private static final Sort BY_NAME = Sort.by("name", "id");

    private final PartnerAccommodationService accommodations;
    private final PartnerRoomService rooms;

    public PartnerCatalogController(PartnerAccommodationService accommodations, PartnerRoomService rooms) {
        this.accommodations = accommodations;
        this.rooms = rooms;
    }

    @GetMapping
    public ApiResponse<PageResponse<AccommodationResponse>> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ApiResponse.success(accommodations.list(CurrentUser.require().id(), PageRequest.of(page, size, BY_NAME)));
    }

    @GetMapping("/{id}")
    public ApiResponse<PartnerAccommodationResponse> get(@PathVariable UUID id) {
        return ApiResponse.success(accommodations.get(CurrentUser.require().id(), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PartnerAccommodationResponse> create(@Valid @RequestBody PartnerAccommodationRequest request) {
        return ApiResponse.success(accommodations.create(CurrentUser.require().id(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<PartnerAccommodationResponse> update(@PathVariable UUID id,
                                                          @Valid @RequestBody PartnerAccommodationRequest request) {
        return ApiResponse.success(accommodations.update(CurrentUser.require().id(), id, request));
    }

    @GetMapping("/{id}/rooms")
    public ApiResponse<PageResponse<PartnerRoomResponse>> listRooms(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ApiResponse.success(rooms.list(CurrentUser.require().id(), id, PageRequest.of(page, size, BY_NAME)));
    }

    @PostMapping("/{id}/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PartnerRoomResponse> createRoom(@PathVariable UUID id,
                                                      @Valid @RequestBody CreatePartnerRoomRequest request) {
        return ApiResponse.success(rooms.create(CurrentUser.require().id(), id, request));
    }

    @PutMapping("/{id}/rooms/{roomId}")
    public ApiResponse<PartnerRoomResponse> updateRoom(@PathVariable UUID id, @PathVariable UUID roomId,
                                                     @Valid @RequestBody PartnerRoomDetails request) {
        return ApiResponse.success(rooms.updateDetails(CurrentUser.require().id(), id, roomId, request));
    }

    @PutMapping("/{id}/rooms/{roomId}/offer")
    public ApiResponse<PartnerRoomResponse> updateOffer(@PathVariable UUID id, @PathVariable UUID roomId,
                                                      @Valid @RequestBody PartnerRoomOffer request) {
        return ApiResponse.success(rooms.updateOffer(CurrentUser.require().id(), id, roomId, request));
    }
}
