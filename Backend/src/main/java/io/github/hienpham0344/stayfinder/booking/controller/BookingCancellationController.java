package io.github.hienpham0344.stayfinder.booking.controller;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.booking.service.BookingLifecycleService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/bookings/{id}")
public class BookingCancellationController {
 private final BookingLifecycleService service;
 public BookingCancellationController(BookingLifecycleService service){this.service=service;}
 @GetMapping("/cancellation-preview") public ResponseEntity<ApiResponse<CancellationPreview>> preview(@PathVariable UUID id){
  return ResponseEntity.ok(ApiResponse.success(service.previewCancellation(CurrentUser.require().id(),id)));
 }
 @PostMapping("/cancel") public ResponseEntity<ApiResponse<BookingResponse>> cancel(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key,
  @Valid @RequestBody(required=false) CancelBookingRequest request){
  return ResponseEntity.ok(ApiResponse.success(service.cancel(CurrentUser.require().id(),id,request==null?null:request.reason(),key)));
 }
}
