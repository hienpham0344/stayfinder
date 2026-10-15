package io.github.hienpham0344.stayfinder.payment.controller;
import io.github.hienpham0344.stayfinder.payment.dto.*;
import io.github.hienpham0344.stayfinder.payment.service.*;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;import org.springframework.web.bind.annotation.*;
import java.util.*;import java.io.IOException;
@RestController
public class PaymentController {
 private final PaymentService service;private final SepayReceiptService receipts;
 public PaymentController(PaymentService service,SepayReceiptService receipts){this.service=service;this.receipts=receipts;}
 @PostMapping("/api/bookings/{bookingId}/payments")
 public ResponseEntity<ApiResponse<PaymentResponse>> create(@PathVariable UUID bookingId,@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody CreatePaymentRequest request){
  return ResponseEntity.ok(ApiResponse.success(service.create(CurrentUser.require().id(),bookingId,request.method(),key)));
 }
 @GetMapping("/api/bookings/{bookingId}/payments")
 public ResponseEntity<ApiResponse<List<PaymentResponse>>> list(@PathVariable UUID bookingId){return ResponseEntity.ok(ApiResponse.success(service.list(CurrentUser.require().id(),bookingId)));}
 @GetMapping({"/api/payments/{id}","/api/payments/{id}/status"})
 public ResponseEntity<ApiResponse<PaymentResponse>> get(@PathVariable UUID id){return ResponseEntity.ok(ApiResponse.success(service.getOwned(CurrentUser.require().id(),id)));}
 @PostMapping(value="/api/payments/webhook/sepay",consumes=MediaType.APPLICATION_JSON_VALUE,produces=MediaType.APPLICATION_JSON_VALUE)
 public ResponseEntity<ProviderAcknowledgement> webhook(HttpServletRequest request,
  @RequestHeader(value="X-SePay-Signature",required=false) String signature,@RequestHeader(value="X-SePay-Timestamp",required=false) String timestamp)throws IOException{
  byte[] raw=request.getInputStream().readNBytes(SepayWebhookAuthenticator.MAX_BODY_BYTES+1);
  return ResponseEntity.ok(receipts.receive(raw,signature,timestamp));
 }
}
