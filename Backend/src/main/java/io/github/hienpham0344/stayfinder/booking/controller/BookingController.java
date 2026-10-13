package io.github.hienpham0344.stayfinder.booking.controller;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.booking.service.BookingService;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.response.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/bookings")
public class BookingController {
 private final BookingService service;
 public BookingController(BookingService service){this.service=service;}
 @PostMapping public ResponseEntity<ApiResponse<BookingResponse>> create(@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody CreateBookingRequest request){
  return ResponseEntity.ok(ApiResponse.success(service.create(CurrentUser.require().id(),request,key)));
 }
 @GetMapping public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> list(@RequestParam(defaultValue="0") int page,
  @RequestParam(defaultValue="20") int size,@RequestParam(required=false) String status){
  if(page<0||size<1||size>100)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  BookingStatus filter=null;
  if(status!=null)filter=java.util.Arrays.stream(BookingStatus.values()).filter(s->s.getValue().equals(status))
    .findFirst().orElseThrow(()->new BusinessException(ErrorCode.VALIDATION_ERROR));
  return ResponseEntity.ok(ApiResponse.success(service.list(CurrentUser.require().id(),filter,PageRequest.of(page,size,Sort.by(Sort.Order.desc("createdAt"),Sort.Order.desc("id"))))));
 }
 @GetMapping("/{id}") public ResponseEntity<ApiResponse<BookingResponse>> get(@PathVariable UUID id){
  return ResponseEntity.ok(ApiResponse.success(service.get(CurrentUser.require().id(),id)));
 }
}
