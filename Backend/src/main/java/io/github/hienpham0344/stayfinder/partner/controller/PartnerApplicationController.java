package io.github.hienpham0344.stayfinder.partner.controller;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.partner.service.PartnerApplicationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/partner-applications")
public class PartnerApplicationController {
    private final PartnerApplicationService service;

    public PartnerApplicationController(PartnerApplicationService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<ManagementViews.Application> submit(
            @Valid @RequestBody ManagementRequests.PartnerApplicationRequest request) {
        return ApiResponse.success(service.submit(request));
    }

    @GetMapping("/me")
    public ApiResponse<ManagementViews.Application> mine() { return ApiResponse.success(service.mine()); }
}
