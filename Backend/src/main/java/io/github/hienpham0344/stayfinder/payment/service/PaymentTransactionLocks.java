package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.*;
import jakarta.persistence.*;import java.util.Objects;
@Service
public class PaymentTransactionLocks {
 private final PaymentRepository payments;private final EntityManager em;
 public PaymentTransactionLocks(PaymentRepository payments,EntityManager em){this.payments=payments;this.em=em;}
 // Caller already holds affected owner wallet -> source room -> booking.
 @Transactional(propagation=Propagation.MANDATORY)
 public Payment lockClassified(Booking b){
  var found=payments.findByBookingId(b.getId()).stream().filter(p->p.getOriginalAmountCents()!=null).toList();
  if(found.size()!=1)throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
  var p=payments.lockById(found.getFirst().getId()).orElseThrow(()->new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
  em.refresh(p,LockModeType.PESSIMISTIC_WRITE);
  if(!Objects.equals(b.getUserId(),p.getUserId())||!Objects.equals(b.getId(),p.getBookingId())||!Objects.equals(b.getTotalPriceCents(),p.getOriginalAmountCents())
   ||!Objects.equals(b.getPaymentMethod(),p.getMethod()))throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
  return p;
 }
}
