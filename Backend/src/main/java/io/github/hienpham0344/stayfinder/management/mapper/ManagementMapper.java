package io.github.hienpham0344.stayfinder.management.mapper;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.audit.entity.AuditLog;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.partner.entity.PartnerApplication;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.review.entity.Review;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ManagementMapper {
    ManagementViews.Application toApplication(PartnerApplication application);
    ManagementViews.Account toAccount(User user);
    ManagementViews.Accommodation toAccommodation(Accommodation accommodation);
    ManagementViews.Room toRoom(Room room);
    ManagementViews.Booking toBooking(Booking booking);
    ManagementViews.Payment toPayment(Payment payment);
    ManagementViews.PaymentAnomaly toPaymentAnomaly(io.github.hienpham0344.stayfinder.payment.entity.PaymentAnomaly anomaly);
    ManagementViews.Review toReview(Review review);
    ManagementViews.Audit toAudit(AuditLog audit);
}
