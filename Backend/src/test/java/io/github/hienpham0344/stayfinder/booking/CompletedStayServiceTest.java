package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.service.PaymentTransactionLocks;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;
import org.junit.jupiter.api.*;import java.time.*;import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;import static org.mockito.ArgumentMatchers.*;
class CompletedStayServiceTest {
 final BookingRepository rows=mock(BookingRepository.class);final BookingTransactionLocks locks=mock(BookingTransactionLocks.class);
 final PaymentTransactionLocks paymentLocks=mock(PaymentTransactionLocks.class);final RewardReservationOperations rewards=mock(RewardReservationOperations.class);
 final DomainEventPublisher events=mock(DomainEventPublisher.class);final CompletedStayService service=new CompletedStayService(rows,locks,paymentLocks,rewards,events);
 final Booking b=new Booking();final BookingQuote q=new BookingQuote();final Payment p=new Payment();
 @BeforeEach void setup(){
  b.setId(UUID.randomUUID());b.setUserId(UUID.randomUUID());b.setStatus(BookingStatus.CONFIRMED);b.setTotalPriceCents(103299L);b.setPaymentStatus("success");b.setRefundStatus("none");b.setPaidAt(Instant.parse("2026-10-12T00:00:00Z"));
  q.setCheckOut(LocalDate.of(2026,10,13));q.setTimezone("Asia/Ho_Chi_Minh");q.setTotalCents(103299L);
  p.setOriginalAmountCents(103299L);p.setStatus(PaymentStatus.SUCCESS);p.setCollectedAt(b.getPaidAt());
  when(rows.findById(b.getId())).thenReturn(Optional.of(b));when(locks.lockOwnedBooking(b.getUserId(),b.getId())).thenReturn(new BookingTransactionLocks.BookingResources(b,q));when(paymentLocks.lockClassified(b)).thenReturn(p);
 }
 @Test void localElevenCheckoutIsExactBoundaryAndPaidCompletionAwardsOnce(){
  assertFalse(service.completeEligible(b.getId(),Instant.parse("2026-10-13T03:59:59Z")));verifyNoInteractions(rewards);
  assertTrue(service.completeEligible(b.getId(),Instant.parse("2026-10-13T04:00:00Z")));assertEquals(BookingStatus.COMPLETED,b.getStatus());
  assertFalse(service.completeEligible(b.getId(),Instant.parse("2026-10-13T12:00:00Z")));verify(rewards,times(1)).earnOnce(b.getUserId(),b.getId(),103299);
  verify(events).publish("booking_completed",b.getUserId(),b.getId(),Instant.parse("2026-10-13T04:00:00Z"));
 }
 @Test void unpaidAfterCheckoutAndCancelledOrRefundedBookingsNeverComplete(){
  b.setPaidAt(null);assertFalse(service.completeEligible(b.getId(),Instant.parse("2026-10-14T00:00:00Z")));
  b.setPaidAt(p.getCollectedAt());b.setStatus(BookingStatus.CANCELLED);assertFalse(service.completeEligible(b.getId(),Instant.parse("2026-10-14T00:00:00Z")));
  b.setStatus(BookingStatus.CONFIRMED);p.setStatus(PaymentStatus.REFUNDED);assertFalse(service.completeEligible(b.getId(),Instant.parse("2026-10-14T00:00:00Z")));verifyNoInteractions(rewards);
 }
}
