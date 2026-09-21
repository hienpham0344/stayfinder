package io.github.hienpham0344.stayfinder.payment.controller;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.payment.dto.CreatePaymentRequest;
import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;
import io.github.hienpham0344.stayfinder.payment.dto.SepayWebhookRequest;
import io.github.hienpham0344.stayfinder.payment.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @PostMapping("/api/bookings/{bookingId}/payments")
    public ResponseEntity<ApiResponse<PaymentResponse>> create(@PathVariable UUID bookingId,
                                                                 @RequestBody(required = false) CreatePaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(bookingId, request)));
    }

    @GetMapping("/api/bookings/{bookingId}/payments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> list(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(ApiResponse.success(service.list(bookingId)));
    }

    @PostMapping("/api/payments/webhook/sepay")
    public ResponseEntity<ApiResponse<PaymentResponse>> webhook(@RequestBody SepayWebhookRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.handleWebhook(request)));
    }
}
