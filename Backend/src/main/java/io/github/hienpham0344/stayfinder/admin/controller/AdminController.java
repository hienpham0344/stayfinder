package io.github.hienpham0344.stayfinder.admin.controller;

import io.github.hienpham0344.stayfinder.admin.service.AdminAccountService;
import io.github.hienpham0344.stayfinder.admin.service.AdminModerationService;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.management.service.OperationsQueryService;
import io.github.hienpham0344.stayfinder.partner.entity.PartnerApplication;
import io.github.hienpham0344.stayfinder.partner.service.PartnerApplicationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminAccountService accounts;
    private final AdminModerationService moderation;
    private final PartnerApplicationService applications;
    private final OperationsQueryService operations;

    public AdminController(AdminAccountService accounts, AdminModerationService moderation,
                            PartnerApplicationService applications, OperationsQueryService operations) {
        this.accounts = accounts;
        this.moderation = moderation;
        this.applications = applications;
        this.operations = operations;
    }

    @GetMapping("/users")
    public ApiResponse<Page<ManagementViews.Account>> users(@RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean enabled, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(accounts.list(role, enabled, page, size));
    }

    @GetMapping("/users/{id}")
    public ApiResponse<ManagementViews.Account> user(@PathVariable UUID id) {
        return ApiResponse.success(accounts.get(id));
    }

    @PatchMapping("/users/{id}")
    public ApiResponse<ManagementViews.Account> updateUser(@PathVariable UUID id,
            @Valid @RequestBody ManagementRequests.AccountUpdate request) {
        return ApiResponse.success(accounts.update(id, request));
    }

    @GetMapping("/partner-applications")
    public ApiResponse<Page<ManagementViews.Application>> applications(
            @RequestParam(required = false) PartnerApplication.Status status,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(applications.list(status, page, size));
    }

    @PostMapping("/partner-applications/{id}/decision")
    public ApiResponse<ManagementViews.Application> decideApplication(@PathVariable UUID id,
            @Valid @RequestBody ManagementRequests.Decision request) {
        return ApiResponse.success(applications.decide(id, request));
    }

    @GetMapping("/accommodations")
    public ApiResponse<Page<ManagementViews.Accommodation>> accommodations(
            @RequestParam(required = false) AccommodationStatus status, @RequestParam(required = false) UUID partnerId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(moderation.accommodations(status, partnerId, page, size));
    }

    @GetMapping("/accommodations/{id}")
    public ApiResponse<ManagementViews.PropertyDetail> accommodation(@PathVariable UUID id) {
        return ApiResponse.success(moderation.accommodation(id));
    }

    @GetMapping("/accommodations/{id}/rooms")
    public ApiResponse<Page<ManagementViews.Room>> rooms(@PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(moderation.rooms(id, page, size));
    }

    @PostMapping("/accommodations/{id}/moderation")
    public ApiResponse<ManagementViews.Accommodation> moderateAccommodation(@PathVariable UUID id,
            @Valid @RequestBody ManagementRequests.AccommodationModeration request) {
        return ApiResponse.success(moderation.moderateAccommodation(id, request));
    }

    @GetMapping("/reviews")
    public ApiResponse<Page<ManagementViews.Review>> reviews(@RequestParam(required = false) Boolean hidden,
            @RequestParam(required = false) UUID accommodationId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(moderation.reviews(hidden, accommodationId, page, size));
    }

    @PostMapping("/reviews/{id}/moderation")
    public ApiResponse<ManagementViews.Review> moderateReview(@PathVariable UUID id,
            @Valid @RequestBody ManagementRequests.ReviewModeration request) {
        return ApiResponse.success(moderation.moderateReview(id, request));
    }

    @GetMapping("/bookings")
    public ApiResponse<Page<ManagementViews.Booking>> bookings(@RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) UUID userId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(operations.adminBookings(status, userId, page, size));
    }

    @GetMapping("/bookings/{id}")
    public ApiResponse<ManagementViews.BookingDetail> booking(@PathVariable UUID id) {
        return ApiResponse.success(operations.adminBooking(id));
    }

    @GetMapping("/payments")
    public ApiResponse<Page<ManagementViews.Payment>> payments(@RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) UUID bookingId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(operations.adminPayments(status, bookingId, page, size));
    }

    @GetMapping("/payments/{id}")
    public ApiResponse<ManagementViews.Payment> payment(@PathVariable UUID id) {
        return ApiResponse.success(operations.adminPayment(id));
    }

    @GetMapping("/payment-anomalies")
    public ApiResponse<Page<ManagementViews.PaymentAnomaly>> paymentAnomalies(
            @RequestParam(required = false) UUID bookingId, @RequestParam(required = false) String reason,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(operations.paymentAnomalies(bookingId, reason, page, size));
    }

    @GetMapping("/payment-anomalies/{id}")
    public ApiResponse<ManagementViews.PaymentAnomaly> paymentAnomaly(@PathVariable UUID id) {
        return ApiResponse.success(operations.paymentAnomaly(id));
    }

    @GetMapping("/statistics")
    public ApiResponse<ManagementViews.Statistics> statistics() {
        return ApiResponse.success(operations.adminStatistics());
    }

    @GetMapping("/audit-logs")
    public ApiResponse<Page<ManagementViews.Audit>> auditLogs(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(moderation.auditLogs(page, size));
    }
}
