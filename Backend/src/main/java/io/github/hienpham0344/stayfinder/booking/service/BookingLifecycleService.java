package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.rewards.service.BookingRewards;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.UUID;

@Service
public class BookingLifecycleService {
    private final BookingRepository bookings;
    private final BookingDetailRepository details;
    private final PaymentRepository payments;
    private final BookingRewards rewards;
    private final BookingPolicy policy;
    public BookingLifecycleService(BookingRepository bookings, BookingDetailRepository details, PaymentRepository payments,
                                   BookingRewards rewards, BookingPolicy policy) {
        this.bookings=bookings; this.details=details; this.payments=payments; this.rewards=rewards; this.policy=policy;
    }
    @Transactional
    public void expire(UUID id) {
        bookings.findForPaymentUpdate(id).filter(b -> b.getStatus()==BookingStatus.PENDING && policy.expired(b))
                .ifPresent(b -> cancelLocked(b,"EXPIRED"));
    }
    @Transactional
    public void cancelLocked(Booking booking, String reason) {
        booking.setStatus(BookingStatus.CANCELLED); booking.setCancellationReason(reason);
        rewards.release(booking.getId()); bookings.save(booking);
    }
    @Transactional
    public void complete(UUID id) {
        Booking booking = bookings.findForPaymentUpdate(id).orElse(null);
        if (booking==null || booking.getStatus()!=BookingStatus.CONFIRMED) return;
        var stays = details.findByBookingId(id);
        if (stays.isEmpty() || stays.stream().anyMatch(d -> d.getCheckOutDate()==null || d.getCheckOutDate().isAfter(policy.completedThrough()))) return;
        BigDecimal paid = payments.findByBookingId(id).stream().filter(p -> p.getStatus()==PaymentStatus.SUCCESS)
                .map(p -> p.getAmount()==null?BigDecimal.ZERO:p.getAmount()).reduce(BigDecimal.ZERO,BigDecimal::add);
        if (booking.getTotalPrice()==null || booking.getTotalPrice().signum()<=0 || paid.compareTo(booking.getTotalPrice())!=0) return;
        rewards.earnCompleted(booking.getUserId(),id,paid);
        booking.setStatus(BookingStatus.COMPLETED); bookings.save(booking);
    }
}
