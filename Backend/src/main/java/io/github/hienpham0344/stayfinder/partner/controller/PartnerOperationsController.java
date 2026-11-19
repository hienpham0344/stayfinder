package io.github.hienpham0344.stayfinder.partner.controller;

import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.management.service.OperationsQueryService;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/partner")
@PreAuthorize("hasRole('PARTNER')")
public class PartnerOperationsController {
    private final OperationsQueryService service;

    public PartnerOperationsController(OperationsQueryService service) { this.service = service; }

    @GetMapping("/bookings")
    public ApiResponse<Page<ManagementViews.Booking>> bookings(@RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.partnerBookings(status, page, size));
    }

    @GetMapping("/bookings/{id}")
    public ApiResponse<ManagementViews.BookingDetail> booking(@PathVariable UUID id) {
        return ApiResponse.success(service.partnerBooking(id));
    }

    @GetMapping("/payments")
    public ApiResponse<Page<ManagementViews.Payment>> payments(@RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) UUID bookingId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.partnerPayments(status, bookingId, page, size));
    }

    @GetMapping("/payments/{id}")
    public ApiResponse<ManagementViews.Payment> payment(@PathVariable UUID id) {
        return ApiResponse.success(service.partnerPayment(id));
    }

    @GetMapping("/statistics")
    public ApiResponse<ManagementViews.Statistics> statistics() {
        return ApiResponse.success(service.partnerStatistics());
    }
}
