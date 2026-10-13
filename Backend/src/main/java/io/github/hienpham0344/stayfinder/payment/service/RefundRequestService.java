package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.entity.*;
import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.math.BigDecimal;
import java.time.Clock;
import java.util.UUID;
@Service
public class RefundRequestService implements RefundRequestOperations {
 private final PaymentRepository payments;private final RefundRequestRepository rows;private final Clock clock;
 public RefundRequestService(PaymentRepository payments,RefundRequestRepository rows,Clock clock){this.payments=payments;this.rows=rows;this.clock=clock;}
 // Caller has already locked owner wallet -> source room -> booking; no bank transfer is performed here.
 @Override @Transactional(propagation=Propagation.MANDATORY)
 public void request(UUID ownerId,UUID bookingId,long amountUsdCents){
  if(ownerId==null||bookingId==null)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  try{MoneyUsd.cents(amountUsdCents);}catch(IllegalArgumentException e){throw new BusinessException(ErrorCode.VALIDATION_ERROR);}
  var prior=rows.findByBookingId(bookingId);
  if(prior.isPresent()){
   var existing=prior.get();
   if(!ownerId.equals(existing.getUserId())||existing.getAmountUsdCents()!=amountUsdCents)throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
   return;
  }
  var collections=payments.findByBookingId(bookingId).stream().filter(p->p.getStatus()==PaymentStatus.SUCCESS&&ownerId.equals(p.getUserId())
   &&p.getOriginalAmountCents()!=null&&p.getOriginalAmountCents()==amountUsdCents).toList();
  if(collections.size()!=1||collections.getFirst().getId()==null)throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
  var paid=collections.getFirst();
  if(!"bank_transfer".equals(paid.getMethod())&&!"pay_at_property".equals(paid.getMethod()))throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
  if("bank_transfer".equals(paid.getMethod())&&(paid.getSettlementVnd()==null||paid.getUsdToVndRate()==null||paid.getRateVersion()==null))throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
  var row=new RefundRequest();row.setId(UUID.randomUUID());row.setBookingId(bookingId);row.setUserId(ownerId);
  row.setPaymentId(collections.getFirst().getId());row.setAmountUsdCents(amountUsdCents);row.setSettlementVnd(paid.getSettlementVnd());row.setUsdToVndRate(paid.getUsdToVndRate());row.setRateVersion(paid.getRateVersion());
  paid.setRefundStatus("requested");payments.save(paid);row.setStatus("requested");row.setRequestedAt(clock.instant());rows.save(row);
 }
}
