package io.github.hienpham0344.stayfinder.booking.mapper;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import org.mapstruct.*;
@Mapper(componentModel="spring")
public interface BookingMapper {
 @Mapping(target="fullName",source="guestFullName") @Mapping(target="email",source="guestEmail")
 @Mapping(target="phone",source="guestPhone") @Mapping(target="specialRequest",source="guestSpecialRequest")
 GuestInformation toGuest(Booking entity);
 BookingDetailResponse toDetailResponse(BookingDetail entity);
}
