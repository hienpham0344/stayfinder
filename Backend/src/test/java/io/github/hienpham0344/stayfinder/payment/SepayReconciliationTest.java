package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.payment.entity.*;
import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.payment.service.*;
import jakarta.persistence.EntityManager;import org.junit.jupiter.api.Test;
import java.time.*;import java.util.*;import java.util.function.Consumer;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;import static org.mockito.ArgumentMatchers.*;
class SepayReconciliationTest {
 static class Fixture {
  final Instant now=Instant.parse("2026-10-13T12:00:00Z");final UUID owner=UUID.randomUUID(),bookId=UUID.randomUUID(),paymentId=UUID.randomUUID(),eventId=UUID.randomUUID();
  final PaymentRepository payments=mock(PaymentRepository.class);final PaymentWebhookEventRepository events=mock(PaymentWebhookEventRepository.class);
  final BookingTransactionLocks locks=mock(BookingTransactionLocks.class);final BookingPaymentOperations bookings=mock(BookingPaymentOperations.class);final EntityManager em=mock(EntityManager.class);
  final Payment p=new Payment();final PaymentWebhookEvent e=new PaymentWebhookEvent();final Booking book=new Booking();
  final SepayReconciliationService service=new SepayReconciliationService(payments,events,locks,bookings,em,Clock.fixed(now,ZoneOffset.UTC));
  Fixture(){
   p.setId(paymentId);p.setUserId(owner);p.setBookingId(bookId);p.setMethod("bank_transfer");p.setProvider("sepay");p.setEnvironment("test");p.setStatus(PaymentStatus.PENDING);
   p.setOriginalAmountCents(103200L);p.setSettlementVnd(25800000L);p.setCreatedAt(now.minusSeconds(10));p.setExpiresAt(now.plusSeconds(900));
   p.setBankName("MBBank");p.setBankAccountNumber("000123456789");p.setTransferReference("SF1234567890");p.setReconciliationStatus("none");p.setRefundStatus("none");
   e.setId(eventId);e.setProvider("sepay");e.setEnvironment("test");e.setEventId("92704");e.setProcessingStatus("received");e.setGateway("MBBank");e.setAccountNumber("000123456789");
   e.setCode("SF1234567890");e.setContent("Synthetic SF1234567890");e.setTransferType("in");e.setTransferAmount(25800000);e.setTransactionAt(now.minusSeconds(1));e.setReceivedAt(now);
   book.setId(bookId);book.setUserId(owner);book.setStatus(BookingStatus.PENDING);book.setPaymentMethod("bank_transfer");book.setTotalPriceCents(103200L);book.setHoldExpiresAt(p.getExpiresAt());
   when(events.findById(eventId)).thenReturn(Optional.of(e));when(events.lockById(eventId)).thenReturn(Optional.of(e));
   when(payments.findByTransferReference("SF1234567890")).thenReturn(Optional.of(p));when(payments.lockById(paymentId)).thenReturn(Optional.of(p));
   when(locks.lockOwnedBooking(owner,bookId)).thenReturn(new BookingTransactionLocks.BookingResources(book,new BookingQuote()));
   when(bookings.recordBankCollection(eq(book),any(),any())).thenReturn(true);
  }
 }
 @Test void exactVerifiedCollectionSucceedsOnceAndPreservesProviderTime(){
  var f=new Fixture();f.service.process(f.eventId);assertEquals(PaymentStatus.SUCCESS,f.p.getStatus());assertEquals(f.e.getTransactionAt(),f.p.getCollectedAt());
  assertEquals("applied",f.e.getProcessingStatus());assertEquals(f.paymentId,f.e.getPaymentId());assertEquals("sepay:test:92704",f.p.getTransactionId());
  f.service.process(f.eventId);verify(f.bookings,times(1)).recordBankCollection(any(),any(),any());verify(f.em).refresh(f.p,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
 }
 @Test void underOverWrongGatewayAccountVaAndTimeCannotConfirm(){
  List<Consumer<Fixture>> mutations=List.of(f->f.e.setTransferAmount(25799999),f->f.e.setTransferAmount(25800001),
   f->f.e.setGateway("OtherBank"),f->f.e.setAccountNumber("999999999"),f->f.e.setSubAccount("wrongVA"),
   f->f.e.setTransactionAt(f.now.minusSeconds(100)),f->f.e.setTransactionAt(f.now.plusSeconds(60)));
  for(var mutation:mutations){var f=new Fixture();mutation.accept(f);f.service.process(f.eventId);
   assertEquals(PaymentStatus.PENDING,f.p.getStatus());assertEquals("required",f.p.getReconciliationStatus());assertEquals("reconciliation",f.e.getProcessingStatus());
   verify(f.bookings,never()).recordBankCollection(any(),any(),any());
  }
 }
 @Test void outgoingAndUnknownReferenceAreRetainedWithoutFinancialChanges(){
  var f=new Fixture();f.e.setTransferType("out");f.service.process(f.eventId);assertEquals("ignored",f.e.getProcessingStatus());verifyNoInteractions(f.bookings,f.locks);
  f=new Fixture();f.e.setContent("Synthetic without reference");f.service.process(f.eventId);assertEquals("unmatched_reference",f.e.getResolutionReason());verifyNoInteractions(f.bookings,f.locks);
 }
 @Test void secondNativeCollectionAndChangedIdPayloadRequireReconciliation(){
  var f=new Fixture();f.p.setStatus(PaymentStatus.SUCCESS);f.p.setTransactionId("sepay:test:earlier");f.service.process(f.eventId);
  assertEquals("duplicate_collection",f.e.getResolutionReason());assertEquals("sepay:test:earlier",f.p.getTransactionId());verifyNoInteractions(f.bookings);
  f=new Fixture();f.e.setConflictCount(1);f.e.setProcessingStatus("reconciliation");f.e.setResolutionReason("payload_conflict");f.service.process(f.eventId);
  assertEquals(1,f.e.getHandledConflictCount());assertEquals("required",f.p.getReconciliationStatus());assertEquals(PaymentStatus.PENDING,f.p.getStatus());verifyNoInteractions(f.bookings);
 }
 @Test void receiptWaitsForDomainLocksBeforePaymentAndReceiptLocks(){
  var f=new Fixture();f.service.process(f.eventId);var order=inOrder(f.locks,f.payments,f.events);
  order.verify(f.events).findById(f.eventId);order.verify(f.payments).findByTransferReference("SF1234567890");
  order.verify(f.locks).lockOwnedBooking(f.owner,f.bookId);order.verify(f.payments).lockById(f.paymentId);order.verify(f.events).lockById(f.eventId);
 }
}
