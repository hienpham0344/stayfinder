package io.github.hienpham0344.stayfinder.payment.controller;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.payment.dto.CreatePaymentRequest;
import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;
import io.github.hienpham0344.stayfinder.payment.service.PaymentService;
import io.github.hienpham0344.stayfinder.payment.service.SepayWebhookService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class PaymentController {
    private final PaymentService service;
    private final SepayWebhookService sepayWebhookService;

    public PaymentController(PaymentService service, SepayWebhookService sepayWebhookService) {
        this.service = service;
        this.sepayWebhookService = sepayWebhookService;
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
    public ResponseEntity<Map<String, Boolean>> webhook(@RequestBody byte[] rawBody,
                                                         @RequestHeader("X-SePay-Timestamp") String timestamp,
                                                         @RequestHeader("X-SePay-Signature") String signature) {
        sepayWebhookService.handle(rawBody, timestamp, signature);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
