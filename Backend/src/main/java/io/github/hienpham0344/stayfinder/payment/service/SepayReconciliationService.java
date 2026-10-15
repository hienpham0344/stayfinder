package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.entity.*;
import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.*;import java.time.*;import java.time.temporal.ChronoUnit;import java.util.*;
@Service
public class SepayReconciliationService {
 private final PaymentRepository payments;private final PaymentWebhookEventRepository events;private final BookingTransactionLocks locks;
 private final BookingPaymentOperations bookings;private final EntityManager em;private final Clock clock;
 public SepayReconciliationService(PaymentRepository payments,PaymentWebhookEventRepository events,BookingTransactionLocks locks,BookingPaymentOperations bookings,EntityManager em,Clock clock){
  this.payments=payments;this.events=events;this.locks=locks;this.bookings=bookings;this.em=em;this.clock=clock;
 }
 @Transactional public void process(UUID eventId){
  var initial=events.findById(eventId).orElse(null);if(initial==null||!actionable(initial))return;
  String ref=PaymentReference.resolve(initial.getCode(),initial.getContent());
  if(!"sepay".equals(initial.getProvider())||!"test".equals(initial.getEnvironment())){receiptOnly(eventId,"reconciliation","environment_mismatch");return;}
  if(!"in".equals(initial.getTransferType())){receiptOnly(eventId,"ignored","outgoing");return;}
  if(ref==null){receiptOnly(eventId,"ignored","unmatched_reference");return;}
  var found=payments.findByTransferReference(ref).orElse(null);
  if(found==null){receiptOnly(eventId,"reconciliation","unknown_payment_reference");return;}
  // Resolve IDs without locks, then always take owner wallet -> room -> booking -> payment -> receipt.
  var resource=locks.lockOwnedBooking(found.getUserId(),found.getBookingId());var b=resource.booking();
  var p=payments.lockById(found.getId()).orElseThrow();em.refresh(p,LockModeType.PESSIMISTIC_WRITE);
  var e=events.lockById(eventId).orElseThrow();em.refresh(e,LockModeType.PESSIMISTIC_WRITE);
  if(!actionable(e))return;
  e.setPaymentId(p.getId());
  if(e.getConflictCount()>0){reconcile(p,e,"payload_conflict");return;}
  String reason=null;
  if(p.getOriginalAmountCents()==null||!Objects.equals(ref,p.getTransferReference())||!"bank_transfer".equals(p.getMethod())||!"sepay".equals(p.getProvider())||!"test".equals(p.getEnvironment())
   ||!Objects.equals(p.getUserId(),b.getUserId())||!Objects.equals(p.getBookingId(),b.getId())||!Objects.equals(p.getOriginalAmountCents(),b.getTotalPriceCents())
   ||!"bank_transfer".equals(b.getPaymentMethod())||!Objects.equals(p.getExpiresAt(),b.getHoldExpiresAt()))reason="payment_terms_mismatch";
  else if(!Objects.equals(e.getGateway(),p.getBankName())||!Objects.equals(e.getAccountNumber(),p.getBankAccountNumber())
   ||!Objects.equals(blankToNull(e.getSubAccount()),p.getBankSubAccount()))reason="receiving_account_mismatch";
  else if(p.getSettlementVnd()==null||e.getTransferAmount()!=p.getSettlementVnd())reason="amount_mismatch";
  else if(e.getTransactionAt().isBefore(p.getCreatedAt().truncatedTo(ChronoUnit.SECONDS))
   ||e.getTransactionAt().isAfter(e.getReceivedAt().truncatedTo(ChronoUnit.SECONDS)))reason="transaction_time_invalid";
  else if(p.getStatus()!=PaymentStatus.PENDING||b.getPaidAt()!=null)reason="duplicate_collection";
  else if(b.getStatus()!=BookingStatus.PENDING&&b.getStatus()!=BookingStatus.CANCELLED)reason="booking_state_invalid";
  if(reason!=null){reconcile(p,e,reason);return;}
  // Preserve exact verified collection even when expiry/cancellation prevents confirmation.
  p.setStatus(PaymentStatus.SUCCESS);p.setTransactionId("sepay:test:"+e.getEventId());p.setCollectedAt(e.getTransactionAt());payments.save(p);
  boolean confirmed=bookings.recordBankCollection(b,e.getTransactionAt(),clock.instant());
  finish(e,"applied",confirmed?"confirmed":"refund_requested");
 }
 private static boolean actionable(PaymentWebhookEvent e){
  return "received".equals(e.getProcessingStatus())||e.getConflictCount()>e.getHandledConflictCount();
 }
 private static String blankToNull(String s){return s==null||s.isBlank()?null:s;}
 private void receiptOnly(UUID id,String status,String reason){
  var e=events.lockById(id).orElseThrow();em.refresh(e,LockModeType.PESSIMISTIC_WRITE);if(!actionable(e))return;
  finish(e,e.getConflictCount()>0?"reconciliation":status,e.getConflictCount()>0?"payload_conflict":reason);
 }
 private void reconcile(Payment p,PaymentWebhookEvent e,String reason){p.setReconciliationStatus("required");payments.save(p);finish(e,"reconciliation",reason);}
 private void finish(PaymentWebhookEvent e,String status,String reason){
  e.setProcessingStatus(status);e.setResolutionReason(reason);e.setProcessedAt(clock.instant());e.setHandledConflictCount(e.getConflictCount());events.save(e);
 }
}
