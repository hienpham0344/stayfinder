package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;import java.util.*;
public interface PaymentService {
 PaymentResponse create(UUID userId,UUID bookingId,String method,String key);
 PaymentResponse getOwned(UUID userId,UUID paymentId);
 List<PaymentResponse> list(UUID userId,UUID bookingId);
}
