package io.github.hienpham0344.stayfinder.accommodation.controller;

import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationService;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.response.*;
import io.github.hienpham0344.stayfinder.room.dto.RoomResponse;
import io.github.hienpham0344.stayfinder.room.service.RoomService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/accommodations")
public class AccommodationController {
    private static final Set<String> SEARCH_PARAMETERS=Set.of("q","locationId","checkIn","checkOut","adults","children","rooms",
        "minPriceCents","maxPriceCents","minRating","typeIds","amenityIds","sort","direction","section","page","size");
    private static final Set<String> ROOM_PARAMETERS=Set.of("checkIn","checkOut","adults","children","rooms","guests");
    private final AccommodationService accommodations;
    private final RoomService rooms;
    private final io.github.hienpham0344.stayfinder.catalog.service.PriceComparisonService comparisons;
    public AccommodationController(AccommodationService accommodations,RoomService rooms,
            io.github.hienpham0344.stayfinder.catalog.service.PriceComparisonService comparisons) {
        this.accommodations=accommodations;this.rooms=rooms;this.comparisons=comparisons;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<StayCardResponse>>> list(@ModelAttribute AccommodationSearchRequest request,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,HttpServletRequest http) {
        parameterNames(http,SEARCH_PARAMETERS);request.validateAndNormalize();
        if(page<0||size<1||size>100)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        return ResponseEntity.ok(ApiResponse.success(accommodations.search(request,PageRequest.of(page,size))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StayDetailResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(accommodations.get(id)));
    }

    @GetMapping("/{id}/rooms")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> rooms(@PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(required=false) Integer adults,@RequestParam(required=false) Integer children,
            @RequestParam(defaultValue="1") int rooms,@RequestParam(required=false) Integer guests,HttpServletRequest http) {
        parameterNames(http,ROOM_PARAMETERS);
        if(guests!=null&&(adults!=null||children!=null))throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        int selectedAdults=guests!=null?guests:adults==null?1:adults;
        int selectedChildren=children==null?0:children;
        return ResponseEntity.ok(ApiResponse.success(this.rooms.available(id,checkIn,checkOut,selectedAdults,selectedChildren,rooms)));
    }
    @GetMapping("/{id}/price-comparisons")
    public ResponseEntity<ApiResponse<io.github.hienpham0344.stayfinder.catalog.dto.ComparisonResult>> comparisons(@PathVariable UUID id,
            @RequestParam UUID roomId,@RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue="1") int quantity,@RequestParam(defaultValue="1") int adults,
            @RequestParam(defaultValue="0") int children,HttpServletRequest http) {
        parameterNames(http,Set.of("roomId","checkIn","checkOut","quantity","adults","children"));
        var selection=new io.github.hienpham0344.stayfinder.common.dto.QuoteSelection(id,roomId,checkIn,checkOut,quantity,adults,children);
        return ResponseEntity.ok(ApiResponse.success(comparisons.compare(id,selection)));
    }
    private static void parameterNames(HttpServletRequest request,Set<String> allowed) {
        if(!allowed.containsAll(request.getParameterMap().keySet()))throw new BusinessException(ErrorCode.VALIDATION_ERROR);
    }
}
