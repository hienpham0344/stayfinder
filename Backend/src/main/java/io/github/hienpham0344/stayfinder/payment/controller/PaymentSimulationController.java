package io.github.hienpham0344.stayfinder.payment.controller;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.payment.dto.*;
import io.github.hienpham0344.stayfinder.payment.service.PaymentSimulationService;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings/{bookingId}/payment-simulations")
@PreAuthorize("hasRole('CUSTOMER')")
public class PaymentSimulationController {
    private final PaymentSimulationService simulations;

    public PaymentSimulationController(PaymentSimulationService simulations) {
        this.simulations = simulations;
    }

    @PostMapping
    public ApiResponse<PaymentSimulationResponse> simulate(@PathVariable UUID bookingId,
            @RequestHeader("Idempotency-Key") String key, @Valid @RequestBody SimulatePaymentRequest request) {
        return ApiResponse.success(simulations.simulate(CurrentUser.require().id(), bookingId, request.outcome(), key));
    }

    @GetMapping
    public ApiResponse<PageResponse<PaymentSimulationResponse>> history(@PathVariable UUID bookingId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(simulations.history(CurrentUser.require().id(), bookingId, page, size));
    }
}
