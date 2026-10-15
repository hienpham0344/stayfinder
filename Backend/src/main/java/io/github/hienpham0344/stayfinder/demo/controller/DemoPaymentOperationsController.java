package io.github.hienpham0344.stayfinder.demo.controller;
import io.github.hienpham0344.stayfinder.demo.dto.*;import io.github.hienpham0344.stayfinder.demo.service.DemoPaymentOperationsService;
import io.github.hienpham0344.stayfinder.payment.dto.*;import io.github.hienpham0344.stayfinder.common.response.ApiResponse;import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;import org.springframework.web.bind.annotation.*;import java.util.UUID;
@RestController @RequestMapping("/api/demo")
public class DemoPaymentOperationsController {
 private final DemoPaymentOperationsService service;
 public DemoPaymentOperationsController(DemoPaymentOperationsService service){this.service=service;}
 @PostMapping("/bookings/{id}/settle") public ApiResponse<PaymentResponse> settle(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key,@RequestBody(required=false) DemoSettlementRequest request){
  return ApiResponse.success(service.settleAtProperty(CurrentUser.require().id(),id,key));
 }
 @PostMapping("/refunds/{id}/confirm") public ApiResponse<RefundResponse> confirm(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody ConfirmRefundRequest request){
  return ApiResponse.success(service.confirmRefund(CurrentUser.require().id(),id,request.reference(),key));
 }
}
