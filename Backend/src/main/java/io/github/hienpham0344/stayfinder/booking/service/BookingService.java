package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
import java.util.UUID;
public interface BookingService {
 PageResponse<BookingResponse> list(UUID userId,BookingStatus status,Pageable pageable);
 BookingResponse get(UUID userId,UUID id);
 BookingResponse create(UUID userId,CreateBookingRequest request,String key);
}
