package io.github.hienpham0344.stayfinder.booking.mapper;

import io.github.hienpham0344.stayfinder.booking.dto.BookingDetailResponse;
import io.github.hienpham0344.stayfinder.booking.dto.BookingResponse;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.entity.BookingDetail;
import org.mapstruct.Mapping;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BookingMapper {
    @Mapping(target = "details", ignore = true)
    BookingResponse toResponse(Booking entity);
    BookingDetailResponse toDetailResponse(BookingDetail entity);
}
