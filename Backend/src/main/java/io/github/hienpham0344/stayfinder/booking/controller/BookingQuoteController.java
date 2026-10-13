package io.github.hienpham0344.stayfinder.booking.controller;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.booking.service.BookingQuoteService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/booking-quotes")
public class BookingQuoteController {
 private final BookingQuoteService service;
 public BookingQuoteController(BookingQuoteService service){this.service=service;}
 @PostMapping public ResponseEntity<ApiResponse<QuoteResponse>> create(@Valid @RequestBody QuoteRequest request){
  return ResponseEntity.ok(ApiResponse.success(service.create(CurrentUser.require().id(),request)));
 }
}
