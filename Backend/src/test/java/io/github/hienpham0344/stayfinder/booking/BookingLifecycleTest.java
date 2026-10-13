package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.payment.service.RefundRequestOperations;
import org.junit.jupiter.api.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class BookingLifecycleTest {
 final BookingServiceTest fixture=new BookingServiceTest();
 final RefundRequestOperations refunds=mock(RefundRequestOperations.class);
 BookingLifecycleService lifecycle;
 @BeforeEach void setup(){
  fixture.setup();fixture.service.create(fixture.user,fixture.request("pay_at_property"),"create-1");
  when(fixture.bookings.findByIdAndUserId(fixture.saved.getId(),fixture.user)).thenReturn(Optional.of(fixture.saved));
  when(fixture.bookings.findById(fixture.saved.getId())).thenReturn(Optional.of(fixture.saved));
  when(fixture.locks.lockOwnedBooking(fixture.user,fixture.saved.getId())).thenAnswer(i->
   new BookingTransactionLocks.BookingResources(fixture.saved,fixture.q));
  lifecycle=service(fixture.clock);
 }
 BookingLifecycleService service(Clock clock){
  return new BookingLifecycleService(fixture.bookings,fixture.quotes,fixture.locks,fixture.benefits,refunds,
    fixture.idem,fixture.events,fixture.reads,clock);
 }
 @Test void unpaidCancellationFreesBenefitsOnceWithoutRefundOrReusingQuote(){
  var first=lifecycle.cancel(fixture.user,fixture.saved.getId()," Change of plans ","cancel-1");
  var retry=lifecycle.cancel(fixture.user,fixture.saved.getId(),"Change of plans","cancel-1");
  var repeat=lifecycle.cancel(fixture.user,fixture.saved.getId(),null,"cancel-2");
  assertEquals("cancelled",first.status());assertEquals(first,retry);assertEquals(first,repeat);
  assertEquals("Change of plans",first.cancellationReason());assertEquals("none",first.refundStatus());
  assertEquals(fixture.saved.getId(),fixture.q.getConsumedBookingId());verify(fixture.benefits,times(1)).release(fixture.saved.getId());
  verifyNoInteractions(refunds);
 }
 @Test void paidCancellationOnlyRequestsRefundAndPreservesCollectionAndConsumedBenefits(){
  fixture.saved.setPaidAt(fixture.clock.instant());fixture.saved.setPaymentStatus("success");
  var preview=lifecycle.previewCancellation(fixture.user,fixture.saved.getId());
  assertTrue(preview.eligible());assertTrue(preview.requiresRefundConfirmation());assertEquals(103200,preview.refundAmount().amountCents());assertEquals(0,preview.penalty().amountCents());
  var result=lifecycle.cancel(fixture.user,fixture.saved.getId(),null,"cancel-1");
  assertEquals("cancelled",result.status());assertEquals("requested",result.refundStatus());assertEquals("success",result.paymentStatus());
  assertNotNull(fixture.saved.getPaidAt());verify(refunds).request(fixture.user,fixture.saved.getId(),103200);
  verify(fixture.benefits,never()).release(any());verify(fixture.benefits,never()).restoreAfterRefund(any());
 }
 @Test void userCannotCancelAtOrAfterLocalFourteenHourCheckIn(){
  Instant atCheckIn=fixture.q.getCheckIn().atTime(14,0).atZone(ZoneId.of(fixture.q.getTimezone())).toInstant();
  var later=service(Clock.fixed(atCheckIn,ZoneOffset.UTC));
  assertFalse(later.previewCancellation(fixture.user,fixture.saved.getId()).eligible());
  assertEquals(ErrorCode.CANCELLATION_NOT_ALLOWED,assertThrows(BusinessException.class,()->later.cancel(fixture.user,fixture.saved.getId(),null,"cancel-1")).getErrorCode());
  assertEquals(BookingStatus.CONFIRMED,fixture.saved.getStatus());verify(fixture.benefits,never()).release(any());
 }
 @Test void expirationUsesStoredBankDeadlineAndNeverCancelsPropertyOrPaidBookings(){
  fixture.saved.setStatus(BookingStatus.PENDING);fixture.saved.setPaymentMethod("bank_transfer");fixture.saved.setHoldExpiresAt(fixture.clock.instant().plusSeconds(900));
  assertFalse(lifecycle.expirePending(fixture.saved.getId(),fixture.clock.instant().plusSeconds(899)));
  assertTrue(lifecycle.expirePending(fixture.saved.getId(),fixture.clock.instant().plusSeconds(900)));
  assertFalse(lifecycle.expirePending(fixture.saved.getId(),fixture.clock.instant().plusSeconds(1000)));
  assertEquals(BookingStatus.CANCELLED,fixture.saved.getStatus());assertEquals("payment_timeout",fixture.saved.getCancellationReason());
  verify(fixture.benefits,times(1)).release(fixture.saved.getId());
  verify(fixture.events).publish("booking_expired",fixture.user,fixture.saved.getId(),fixture.clock.instant().plusSeconds(900));
 }
 @Test void verifiedPaidAndPropertyBookingsAreNeverExpired(){
  fixture.saved.setHoldExpiresAt(fixture.clock.instant());fixture.saved.setPaidAt(fixture.clock.instant());
  assertFalse(lifecycle.expirePending(fixture.saved.getId(),fixture.clock.instant().plusSeconds(900)));
  fixture.saved.setPaidAt(null);fixture.saved.setStatus(BookingStatus.CONFIRMED);fixture.saved.setHoldExpiresAt(null);
  assertFalse(lifecycle.expirePending(fixture.saved.getId(),fixture.clock.instant().plusSeconds(900)));
  verify(fixture.benefits,never()).release(any());
 }
 @Test void foreignBookingPreviewIsNotFoundAndReasonIsLimited(){
  assertEquals(ErrorCode.BOOKING_NOT_FOUND,assertThrows(BusinessException.class,()->lifecycle.previewCancellation(UUID.randomUUID(),fixture.saved.getId())).getErrorCode());
  assertThrows(BusinessException.class,()->lifecycle.cancel(fixture.user,fixture.saved.getId(),"x".repeat(501),"cancel-1"));
 }
}
