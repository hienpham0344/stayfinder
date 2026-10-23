package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;
import io.github.hienpham0344.stayfinder.payment.service.PaymentTransactionLocks;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;
import java.time.*;import java.util.*;
@Service
public class CompletedStayService {
 private final BookingRepository rows;private final BookingTransactionLocks locks;private final PaymentTransactionLocks payments;
 private final RewardReservationOperations rewards;private final DomainEventPublisher events;
 public CompletedStayService(BookingRepository rows,BookingTransactionLocks locks,PaymentTransactionLocks payments,RewardReservationOperations rewards,DomainEventPublisher events){
  this.rows=rows;this.locks=locks;this.payments=payments;this.rewards=rewards;this.events=events;
 }
 @Transactional public boolean completeEligible(UUID id,Instant now){
  var initial=rows.findById(id).orElse(null);
  if(initial==null||initial.getStatus()!=BookingStatus.CONFIRMED||initial.getPaidAt()==null)return false;
  var resource=locks.lockOwnedBooking(initial.getUserId(),id);var b=resource.booking();var q=resource.quote();
  if(b.getStatus()!=BookingStatus.CONFIRMED||b.getPaidAt()==null||!"success".equals(b.getPaymentStatus())||!"none".equals(b.getRefundStatus()))return false;
  if(now.isBefore(q.getCheckOut().atTime(11,0).atZone(ZoneId.of(q.getTimezone())).toInstant()))return false;
  var p=payments.lockClassified(b);
  if(p.getStatus()!=PaymentStatus.SUCCESS||p.getCollectedAt()==null||!p.getCollectedAt().equals(b.getPaidAt())||p.getOriginalAmountCents()!=q.getTotalCents())return false;
  rewards.earnOnce(b.getUserId(),id,p.getOriginalAmountCents());b.setStatus(BookingStatus.COMPLETED);b.setCompletedAt(now);rows.save(b);
  events.publish("booking_completed",b.getUserId(),id,now);return true;
 }
}
