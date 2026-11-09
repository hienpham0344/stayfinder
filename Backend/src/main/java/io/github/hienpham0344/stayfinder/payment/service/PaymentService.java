package io.github.hienpham0344.stayfinder.payment.service;

import io.github.hienpham0344.stayfinder.payment.dto.CreatePaymentRequest;
import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;

import java.util.List;
import java.util.UUID;

public interface PaymentService {
    PaymentResponse create(UUID bookingId, CreatePaymentRequest request);
    List<PaymentResponse> list(UUID bookingId);
}
