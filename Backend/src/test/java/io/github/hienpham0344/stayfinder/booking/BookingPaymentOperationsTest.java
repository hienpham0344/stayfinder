package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentOperationsImpl;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.payment.service.RefundRequestOperations;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;
import org.junit.jupiter.api.Test;import java.time.*;import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;import static org.mockito.ArgumentMatchers.*;
class BookingPaymentOperationsTest {
 final BookingRepository rows=mock(BookingRepository.class);final RewardReservationOperations benefits=mock(RewardReservationOperations.class);
 final RefundRequestOperations refunds=mock(RefundRequestOperations.class);final DomainEventPublisher events=mock(DomainEventPublisher.class);
 final BookingPaymentOperationsImpl service=new BookingPaymentOperationsImpl(rows,benefits,refunds,events);
 final Instant now=Instant.parse("2026-10-13T12:00:00Z");
 Booking booking(){var b=new Booking();b.setId(UUID.randomUUID());b.setUserId(UUID.randomUUID());b.setTotalPriceCents(103200L);b.setPaymentMethod("bank_transfer");
  b.setStatus(BookingStatus.PENDING);b.setHoldExpiresAt(now.plusSeconds(900));b.setPaymentStatus("pending");b.setRefundStatus("none");return b;}
 @Test void paidBeforeDeadlineConfirmsAndConsumesExactlyOnce(){
  var b=booking();assertTrue(service.recordBankCollection(b,now.minusSeconds(1),now));
  assertEquals(BookingStatus.CONFIRMED,b.getStatus());assertEquals("success",b.getPaymentStatus());assertEquals(now.minusSeconds(1),b.getPaidAt());
  verify(benefits).consume(b.getId());verify(events).publish("booking_paid",b.getUserId(),b.getId(),now);verifyNoInteractions(refunds);
 }
 @Test void lateProcessingNeverRevivesExpiredRoomEvenForEarlierTransfer(){
  var b=booking();b.setHoldExpiresAt(now);assertFalse(service.recordBankCollection(b,now.minusSeconds(1),now));
  assertEquals(BookingStatus.CANCELLED,b.getStatus());assertEquals("payment_timeout",b.getCancellationReason());assertEquals("requested",b.getRefundStatus());
  assertEquals("success",b.getPaymentStatus());verify(benefits).release(b.getId());verify(benefits,never()).consume(any());
  verify(refunds).request(b.getUserId(),b.getId(),103200);verify(events).publish("refund_requested",b.getUserId(),b.getId(),now);
 }
 @Test void cancelledCollectionRequestsRefundWithoutReleasingBenefitsAgain(){
  var b=booking();b.setStatus(BookingStatus.CANCELLED);b.setCancellationReason("guest cancellation");
  assertFalse(service.recordBankCollection(b,now.minusSeconds(1),now));assertEquals("guest cancellation",b.getCancellationReason());
  verifyNoInteractions(benefits);verify(refunds).request(b.getUserId(),b.getId(),103200);
 }
}
