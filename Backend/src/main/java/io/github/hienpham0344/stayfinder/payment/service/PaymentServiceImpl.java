package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.booking.service.BookingTransactionLocks;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;
import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.mapper.PaymentMapper;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;import java.time.*;import java.util.*;
@Service
public class PaymentServiceImpl implements PaymentService {
 private final PaymentRepository rows;private final BookingTransactionLocks locks;private final IdempotencyService idem;
 private final BookingRepository bookings;private final PaymentProvider provider;private final PaymentMapper mapper;private final Clock clock;
 public PaymentServiceImpl(PaymentRepository rows,BookingTransactionLocks locks,IdempotencyService idem,PaymentProvider provider,PaymentMapper mapper,Clock clock,BookingRepository bookings){
  this.rows=rows;this.locks=locks;this.idem=idem;this.provider=provider;this.mapper=mapper;this.clock=clock;this.bookings=bookings;
 }
 @Override @Transactional public PaymentResponse create(UUID owner,UUID bookingId,String method,String key){
  if(method==null||!Set.of("bank_transfer","pay_at_property").contains(method))throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  record Payload(UUID bookingId,String method){}
  return idem.execute(owner,"payment:create",key,idem.fingerprint(new Payload(bookingId,method)),PaymentResponse.class,()->{
   var resource=locks.lockOwnedBooking(owner,bookingId);var b=resource.booking();Instant now=clock.instant();
   if(!method.equals(b.getPaymentMethod())||!owner.equals(b.getUserId())||b.getTotalPriceCents()==null
    ||b.getTotalPriceCents()!=resource.quote().getTotalCents())throw invalidState();
   if(b.getStatus()!=BookingStatus.PENDING&&b.getStatus()!=BookingStatus.CONFIRMED)throw invalidState();
   if(method.equals("bank_transfer")&&b.getPaidAt()==null&&(b.getStatus()!=BookingStatus.PENDING||b.getHoldExpiresAt()==null||!now.isBefore(b.getHoldExpiresAt())))throw invalidState();
   var existing=rows.findByBookingId(bookingId).stream().filter(p->p.getOriginalAmountCents()!=null).toList();
   if(existing.size()>1)throw invalidState();
   if(!existing.isEmpty()){
    var p=existing.getFirst();if(!owner.equals(p.getUserId())||!method.equals(p.getMethod())||!b.getTotalPriceCents().equals(p.getOriginalAmountCents()))throw invalidState();
    return mapper.toResponse(p);
   }
   if(b.getPaidAt()!=null)throw invalidState();
   var p=new Payment();p.setId(UUID.randomUUID());p.setUserId(owner);p.setBookingId(bookingId);p.setMethod(method);
   p.setOriginalAmountCents(b.getTotalPriceCents());p.setAmount(BigDecimal.valueOf(b.getTotalPriceCents(),2));
   p.setStatus(PaymentStatus.PENDING);p.setCreatedAt(now);p.setReconciliationStatus("none");p.setRefundStatus("none");
   if(method.equals("bank_transfer")){
    var setup=provider.createBankInstructions(p.getId(),p.getOriginalAmountCents());var i=setup.instructions();
    p.setProvider("sepay");p.setEnvironment("test");p.setExpiresAt(b.getHoldExpiresAt());p.setSettlementVnd(i.amount());
    p.setUsdToVndRate(i.usdToVndRate());p.setRateVersion(i.rateVersion());p.setTransferReference(i.transferReference());
    p.setBankName(i.bankName());p.setBankCode(setup.bankCode());p.setBankAccountNumber(setup.receivingAccountNumber());p.setBankSubAccount(setup.subAccount());
    p.setBankAccountHolder(i.accountHolder());p.setQrImageUrl(i.qrImageUrl());
   }else p.setProvider("property");
   return mapper.toResponse(rows.save(p));
  });
 }
 @Override @Transactional(readOnly=true) public PaymentResponse getOwned(UUID owner,UUID id){
  var p=rows.findByIdAndUserId(id,owner).filter(x->x.getOriginalAmountCents()!=null).orElseThrow(()->new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
  return mapper.toResponse(p);
 }
 @Override @Transactional(readOnly=true) public List<PaymentResponse> list(UUID owner,UUID bookingId){
  bookings.findByIdAndUserId(bookingId,owner).orElseThrow(()->new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
  return rows.findByBookingId(bookingId).stream().filter(p->owner.equals(p.getUserId())&&p.getOriginalAmountCents()!=null).map(mapper::toResponse).toList();
 }
 private static BusinessException invalidState(){return new BusinessException(ErrorCode.BOOKING_INVALID_STATE);}
}
