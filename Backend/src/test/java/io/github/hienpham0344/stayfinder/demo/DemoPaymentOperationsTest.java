package io.github.hienpham0344.stayfinder.demo;
import io.github.hienpham0344.stayfinder.demo.service.DemoPaymentOperationsService;
import io.github.hienpham0344.stayfinder.booking.entity.*;import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;import io.github.hienpham0344.stayfinder.booking.service.BookingTransactionLocks;
import io.github.hienpham0344.stayfinder.payment.entity.*;import io.github.hienpham0344.stayfinder.payment.repository.*;import io.github.hienpham0344.stayfinder.payment.service.PaymentTransactionLocks;import io.github.hienpham0344.stayfinder.payment.mapper.PaymentMapper;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;import io.github.hienpham0344.stayfinder.reward.repository.RewardReservationRepository;
import io.github.hienpham0344.stayfinder.common.enums.*;import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;import io.github.hienpham0344.stayfinder.common.audit.AuditService;import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;import io.github.hienpham0344.stayfinder.common.exception.*;
import org.junit.jupiter.api.*;import org.mapstruct.factory.Mappers;import jakarta.persistence.EntityManager;
import java.time.*;import java.util.*;import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;import static org.mockito.ArgumentMatchers.*;
class DemoPaymentOperationsTest {
 final UUID actor=UUID.randomUUID();final BookingRepository rows=mock(BookingRepository.class);final PaymentRepository payments=mock(PaymentRepository.class);final RefundRequestRepository refunds=mock(RefundRequestRepository.class);
 final BookingTransactionLocks locks=mock(BookingTransactionLocks.class);final PaymentTransactionLocks paymentLocks=mock(PaymentTransactionLocks.class);
 final RewardReservationOperations benefits=mock(RewardReservationOperations.class);final RewardReservationRepository reservations=mock(RewardReservationRepository.class);
 final IdempotencyService idem=mock(IdempotencyService.class);final AuditService audit=mock(AuditService.class);final DomainEventPublisher events=mock(DomainEventPublisher.class);final EntityManager em=mock(EntityManager.class);
 final Clock clock=Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"),ZoneOffset.UTC);final PaymentMapper mapper=Mappers.getMapper(PaymentMapper.class);
 final Booking b=new Booking();final Payment p=new Payment();final RefundRequest r=new RefundRequest();
 DemoPaymentOperationsService service(boolean enabled){return new DemoPaymentOperationsService(enabled,rows,payments,refunds,locks,paymentLocks,benefits,reservations,idem,audit,events,mapper,em,clock);}
 @BeforeEach void setup(){
  b.setId(UUID.randomUUID());b.setUserId(UUID.randomUUID());b.setStatus(BookingStatus.CONFIRMED);b.setPaymentMethod("pay_at_property");b.setTotalPriceCents(103200L);b.setRefundStatus("none");b.setPaymentStatus("pending");
  p.setId(UUID.randomUUID());p.setBookingId(b.getId());p.setUserId(b.getUserId());p.setMethod("pay_at_property");p.setOriginalAmountCents(103200L);p.setStatus(PaymentStatus.PENDING);p.setCreatedAt(clock.instant());p.setRefundStatus("none");p.setReconciliationStatus("none");
  r.setId(UUID.randomUUID());r.setBookingId(b.getId());r.setUserId(b.getUserId());r.setPaymentId(p.getId());r.setAmountUsdCents(103200);r.setStatus("requested");r.setRequestedAt(clock.instant());
  when(rows.findById(b.getId())).thenReturn(Optional.of(b));when(locks.lockOwnedBooking(b.getUserId(),b.getId())).thenReturn(new BookingTransactionLocks.BookingResources(b,new BookingQuote()));
  when(paymentLocks.lockClassified(b)).thenReturn(p);when(refunds.findById(r.getId())).thenReturn(Optional.of(r));when(refunds.lockById(r.getId())).thenReturn(Optional.of(r));
  when(idem.fingerprint(any())).thenReturn("a".repeat(64));when(idem.execute(eq(actor),anyString(),anyString(),anyString(),any(),any())).thenAnswer(i->((Supplier<?>)i.getArgument(5)).get());
 }
 @Test void defaultOffControlsCannotMutateAnything(){
  assertEquals(ErrorCode.FORBIDDEN,assertThrows(BusinessException.class,()->service(false).settleAtProperty(actor,b.getId(),"fixture")).getErrorCode());
  assertEquals(ErrorCode.FORBIDDEN,assertThrows(BusinessException.class,()->service(false).confirmRefund(actor,r.getId(),"Synthetic ref","fixture")).getErrorCode());
  verifyNoInteractions(rows,payments,refunds,benefits,audit,idem);
 }
 @Test void propertySettlementUsesExactPendingLedgerAndIsOnceWithAudit(){
  var s=service(true);assertEquals("success",s.settleAtProperty(actor,b.getId(),"first").status());assertEquals("success",b.getPaymentStatus());
  assertEquals(clock.instant(),b.getPaidAt());assertEquals(clock.instant(),p.getCollectedAt());verify(benefits).consume(b.getId());verify(audit).record(actor,"demo_property_settled",b.getId());
  s.settleAtProperty(actor,b.getId(),"other-key");verify(benefits,times(1)).consume(b.getId());verify(audit,times(1)).record(any(),anyString(),any());
 }
 @Test void requestedRefundPreservesOriginalCollectionAndRestoresConsumedBenefitsOnce(){
  b.setStatus(BookingStatus.CANCELLED);b.setPaidAt(clock.instant().minusSeconds(30));b.setRefundStatus("requested");p.setStatus(PaymentStatus.SUCCESS);p.setCollectedAt(b.getPaidAt());p.setTransactionId("Synthetic collection");
  var reservation=new io.github.hienpham0344.stayfinder.reward.entity.RewardReservation();reservation.setState("consumed");when(reservations.findById(b.getId())).thenReturn(Optional.of(reservation));
  var s=service(true);var result=s.confirmRefund(actor,r.getId()," Synthetic confirmation ","first");
  assertEquals("confirmed",result.status());assertEquals("refunded",b.getPaymentStatus());assertEquals("Synthetic collection",p.getTransactionId());assertEquals(b.getPaidAt(),p.getCollectedAt());
  s.confirmRefund(actor,r.getId(),"Synthetic confirmation","second");verify(benefits,times(1)).restoreAfterRefund(b.getId());verify(audit).record(actor,"demo_refund_confirmed",r.getId());
 }
 @Test void latePaymentAlreadyReleasedBenefitsCannotRestoreThemAgain(){
  b.setStatus(BookingStatus.CANCELLED);b.setPaidAt(clock.instant());b.setRefundStatus("requested");p.setStatus(PaymentStatus.SUCCESS);p.setCollectedAt(clock.instant());
  var reservation=new io.github.hienpham0344.stayfinder.reward.entity.RewardReservation();reservation.setState("released");when(reservations.findById(b.getId())).thenReturn(Optional.of(reservation));
  service(true).confirmRefund(actor,r.getId(),"Synthetic confirmation","first");verify(benefits,never()).restoreAfterRefund(any());assertEquals("confirmed",r.getStatus());
 }
}
