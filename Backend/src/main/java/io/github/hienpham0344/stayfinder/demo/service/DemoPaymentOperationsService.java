package io.github.hienpham0344.stayfinder.demo.service;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.BookingTransactionLocks;
import io.github.hienpham0344.stayfinder.payment.entity.*;import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.payment.service.PaymentTransactionLocks;import io.github.hienpham0344.stayfinder.payment.mapper.PaymentMapper;import io.github.hienpham0344.stayfinder.payment.dto.*;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;import io.github.hienpham0344.stayfinder.reward.repository.RewardReservationRepository;
import io.github.hienpham0344.stayfinder.common.enums.*;import io.github.hienpham0344.stayfinder.common.exception.*;import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.audit.AuditService;import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import org.springframework.stereotype.Service;import org.springframework.beans.factory.annotation.Value;import org.springframework.transaction.annotation.Transactional;import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.persistence.*;import java.time.*;import java.util.*;
@Service
public class DemoPaymentOperationsService {
 private final boolean enabled;private final BookingRepository bookings;private final PaymentRepository payments;private final RefundRequestRepository refunds;
 private final BookingTransactionLocks locks;private final PaymentTransactionLocks paymentLocks;private final RewardReservationOperations benefits;private final RewardReservationRepository reservations;
 private final IdempotencyService idem;private final AuditService audit;private final DomainEventPublisher events;private final PaymentMapper mapper;private final EntityManager em;private final Clock clock;
 public DemoPaymentOperationsService(@Value("${stayfinder.demo-operations.enabled:false}") boolean enabled,BookingRepository bookings,PaymentRepository payments,RefundRequestRepository refunds,
  BookingTransactionLocks locks,PaymentTransactionLocks paymentLocks,RewardReservationOperations benefits,RewardReservationRepository reservations,IdempotencyService idem,
  AuditService audit,DomainEventPublisher events,PaymentMapper mapper,EntityManager em,Clock clock){
  this.enabled=enabled;this.bookings=bookings;this.payments=payments;this.refunds=refunds;this.locks=locks;this.paymentLocks=paymentLocks;this.benefits=benefits;
  this.reservations=reservations;this.idem=idem;this.audit=audit;this.events=events;this.mapper=mapper;this.em=em;this.clock=clock;
 }
 private void requireEnabled(){if(!enabled)throw new BusinessException(ErrorCode.FORBIDDEN);}
 @PreAuthorize("hasRole('ADMIN')") @Transactional public PaymentResponse settleAtProperty(UUID actor,UUID bookingId,String key){
  requireEnabled();record Payload(UUID bookingId){}
  return idem.execute(actor,"demo:settle_property",key,idem.fingerprint(new Payload(bookingId)),PaymentResponse.class,()->{
   var initial=bookings.findById(bookingId).orElseThrow(()->new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
   var b=locks.lockOwnedBooking(initial.getUserId(),bookingId).booking();var p=paymentLocks.lockClassified(b);
   if(!"pay_at_property".equals(b.getPaymentMethod())||b.getStatus()!=BookingStatus.CONFIRMED)throw invalid();
   if(p.getStatus()==PaymentStatus.SUCCESS&&b.getPaidAt()!=null&&b.getPaidAt().equals(p.getCollectedAt()))return mapper.toResponse(p);
   if(p.getStatus()!=PaymentStatus.PENDING||b.getPaidAt()!=null)throw invalid();
   Instant now=clock.instant();benefits.consume(bookingId);p.setStatus(PaymentStatus.SUCCESS);p.setCollectedAt(now);payments.save(p);
   b.setPaidAt(now);b.setPaymentStatus("success");bookings.save(b);audit.record(actor,"demo_property_settled",bookingId);
   events.publish("booking_paid",b.getUserId(),bookingId,now);return mapper.toResponse(p);
  });
 }
 @PreAuthorize("hasRole('ADMIN')") @Transactional public RefundResponse confirmRefund(UUID actor,UUID refundId,String reference,String key){
  requireEnabled();
  if(reference==null||reference.trim().isEmpty()||reference.trim().length()>120||reference.chars().anyMatch(Character::isISOControl))throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  String normalized=reference.trim();record Payload(UUID refundId,String reference){}
  return idem.execute(actor,"demo:confirm_refund",key,idem.fingerprint(new Payload(refundId,normalized)),RefundResponse.class,()->{
   var initial=refunds.findById(refundId).orElseThrow(()->new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
   var b=locks.lockOwnedBooking(initial.getUserId(),initial.getBookingId()).booking();var p=paymentLocks.lockClassified(b);
   var r=refunds.lockById(refundId).orElseThrow(()->new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));em.refresh(r,LockModeType.PESSIMISTIC_WRITE);
   if(!Objects.equals(r.getUserId(),b.getUserId())||!Objects.equals(r.getBookingId(),b.getId())||!Objects.equals(r.getPaymentId(),p.getId())
    ||p.getOriginalAmountCents()!=r.getAmountUsdCents()||!Objects.equals(r.getSettlementVnd(),p.getSettlementVnd())||!Objects.equals(r.getUsdToVndRate(),p.getUsdToVndRate())
    ||!Objects.equals(r.getRateVersion(),p.getRateVersion()))throw invalid();
   if("confirmed".equals(r.getStatus())){
    if(!normalized.equals(r.getReference()))throw new BusinessException(ErrorCode.IDEMPOTENCY_CONFLICT);
    return response(r);
   }
   if(!"requested".equals(r.getStatus())||b.getStatus()!=BookingStatus.CANCELLED||b.getPaidAt()==null||!"requested".equals(b.getRefundStatus())||p.getStatus()!=PaymentStatus.SUCCESS)throw invalid();
   var held=reservations.findById(b.getId()).orElseThrow(DemoPaymentOperationsService::invalid);
   if("consumed".equals(held.getState()))benefits.restoreAfterRefund(b.getId());else if(!"released".equals(held.getState()))throw invalid();
   Instant now=clock.instant();r.setStatus("confirmed");r.setConfirmedAt(now);r.setConfirmedBy(actor);r.setReference(normalized);refunds.save(r);
   p.setStatus(PaymentStatus.REFUNDED);p.setRefundStatus("confirmed");payments.save(p);b.setPaymentStatus("refunded");b.setRefundStatus("confirmed");bookings.save(b);
   audit.record(actor,"demo_refund_confirmed",refundId);events.publish("refund_confirmed",b.getUserId(),b.getId(),now);return response(r);
  });
 }
 private static RefundResponse response(RefundRequest r){return new RefundResponse(r.getId(),r.getBookingId(),r.getPaymentId(),r.getStatus(),MoneyUsd.cents(r.getAmountUsdCents()),
  r.getSettlementVnd(),r.getUsdToVndRate(),r.getRateVersion(),r.getRequestedAt(),r.getConfirmedAt(),r.getReference());}
 private static BusinessException invalid(){return new BusinessException(ErrorCode.BOOKING_INVALID_STATE);}
}
