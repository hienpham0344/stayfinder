package io.github.hienpham0344.stayfinder.booking.service;

import io.github.hienpham0344.stayfinder.booking.dto.BookingResponse;
import io.github.hienpham0344.stayfinder.booking.dto.CreateBookingRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface BookingService {
    Page<BookingResponse> list(Pageable pageable);
    BookingResponse get(UUID id);
    BookingResponse create(CreateBookingRequest request);
    BookingResponse cancel(UUID id);
}
