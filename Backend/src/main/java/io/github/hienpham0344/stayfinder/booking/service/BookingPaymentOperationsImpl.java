package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;
import io.github.hienpham0344.stayfinder.payment.service.RefundRequestOperations;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.*;
import java.time.Instant;
@Service
public class BookingPaymentOperationsImpl implements BookingPaymentOperations {
 private final BookingRepository rows;private final RewardReservationOperations benefits;private final RefundRequestOperations refunds;private final DomainEventPublisher events;
 public BookingPaymentOperationsImpl(BookingRepository rows,RewardReservationOperations benefits,RefundRequestOperations refunds,DomainEventPublisher events){
  this.rows=rows;this.benefits=benefits;this.refunds=refunds;this.events=events;
 }
 @Override @Transactional(propagation=Propagation.MANDATORY)
 public boolean recordBankCollection(Booking b,Instant collectedAt,Instant now){
  if(!"bank_transfer".equals(b.getPaymentMethod())||b.getPaidAt()!=null||b.getHoldExpiresAt()==null||b.getTotalPriceCents()==null
   ||(b.getStatus()!=BookingStatus.PENDING&&b.getStatus()!=BookingStatus.CANCELLED))throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
  boolean onTime=b.getStatus()==BookingStatus.PENDING&&now.isBefore(b.getHoldExpiresAt())&&collectedAt.isBefore(b.getHoldExpiresAt());
  if(onTime){
   benefits.consume(b.getId());b.setStatus(BookingStatus.CONFIRMED);
  }else{
   if(b.getStatus()==BookingStatus.PENDING){
    benefits.release(b.getId());b.setStatus(BookingStatus.CANCELLED);b.setCancellationReason("payment_timeout");b.setCancelledAt(now);
    events.publish("booking_expired",b.getUserId(),b.getId(),now);
   }
   // A cancelled booking's benefit hold has already been released; never debit or restore it again.
   refunds.request(b.getUserId(),b.getId(),b.getTotalPriceCents());b.setRefundStatus("requested");
   events.publish("refund_requested",b.getUserId(),b.getId(),now);
  }
  b.setPaidAt(collectedAt);b.setPaymentStatus("success");rows.save(b);
  if(onTime)events.publish("booking_paid",b.getUserId(),b.getId(),now);
  return onTime;
 }
}
