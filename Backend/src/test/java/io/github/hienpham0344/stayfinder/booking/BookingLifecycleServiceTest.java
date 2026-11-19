package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.rewards.service.BookingRewards;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class BookingLifecycleServiceTest {
    private final BookingRepository bookings=mock(BookingRepository.class);
    private final BookingDetailRepository details=mock(BookingDetailRepository.class);
    private final PaymentRepository payments=mock(PaymentRepository.class);
    private final BookingRewards rewards=mock(BookingRewards.class);
    private final Instant now=Instant.parse("2030-06-01T05:00:00Z");
    private final BookingPolicy policy=new BookingPolicy(Clock.fixed(now,ZoneOffset.UTC),15,"Asia/Ho_Chi_Minh","12:00");
    private final BookingLifecycleService service=new BookingLifecycleService(bookings,details,payments,rewards,policy);
    @Test void expiredPendingBookingReleasesVoucherAndIsIdempotent() {
        Booking b=booking(BookingStatus.PENDING);b.setExpiresAt(now);service.expire(b.getId());service.expire(b.getId());
        assertEquals(BookingStatus.CANCELLED,b.getStatus());assertEquals("EXPIRED",b.getCancellationReason());verify(rewards,times(1)).release(b.getId());
    }
    @Test void completingPaidStayAwardsOnceUsingNetPaidAmount() {
        Booking b=booking(BookingStatus.CONFIRMED);BookingDetail d=new BookingDetail();d.setCheckOutDate(LocalDate.of(2030,6,1));
        when(details.findByBookingId(b.getId())).thenReturn(List.of(d));Payment p=new Payment();p.setStatus(PaymentStatus.SUCCESS);p.setAmount(b.getTotalPrice());
        when(payments.findByBookingId(b.getId())).thenReturn(List.of(p));service.complete(b.getId());service.complete(b.getId());
        assertEquals(BookingStatus.COMPLETED,b.getStatus());verify(rewards,times(1)).earnCompleted(b.getUserId(),b.getId(),b.getTotalPrice());
    }
    @Test void confirmedBookingWithoutMatchingSuccessfulPaymentCannotMintPoints() {
        Booking b=booking(BookingStatus.CONFIRMED);BookingDetail d=new BookingDetail();d.setCheckOutDate(LocalDate.of(2030,6,1));
        when(details.findByBookingId(b.getId())).thenReturn(List.of(d));service.complete(b.getId());
        assertEquals(BookingStatus.CONFIRMED,b.getStatus());verifyNoInteractions(rewards);
    }
    private Booking booking(BookingStatus status) {
        Booking b=new Booking();b.setId(UUID.randomUUID());b.setUserId(UUID.randomUUID());b.setStatus(status);b.setTotalPrice(new BigDecimal("990000"));
        when(bookings.findForPaymentUpdate(b.getId())).thenReturn(Optional.of(b));return b;
    }
}
