package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;
import io.github.hienpham0344.stayfinder.payment.service.RefundRequestOperations;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
@Service
public class BookingLifecycleService {
 private final BookingRepository bookings;private final BookingQuoteRepository quotes;private final BookingTransactionLocks locks;
 private final RewardReservationOperations benefits;private final RefundRequestOperations refunds;private final IdempotencyService idem;
 private final DomainEventPublisher events;private final BookingReadService reads;private final Clock clock;
 public BookingLifecycleService(BookingRepository bookings,BookingQuoteRepository quotes,BookingTransactionLocks locks,RewardReservationOperations benefits,
  RefundRequestOperations refunds,IdempotencyService idem,DomainEventPublisher events,BookingReadService reads,Clock clock){
  this.bookings=bookings;this.quotes=quotes;this.locks=locks;this.benefits=benefits;this.refunds=refunds;this.idem=idem;this.events=events;this.reads=reads;this.clock=clock;
 }
 @Transactional(readOnly=true)
 public CancellationPreview previewCancellation(UUID userId,UUID bookingId){
  var book=bookings.findByIdAndUserId(bookingId,userId).orElseThrow(()->new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
  if(book.getQuoteId()==null)throw unavailable();
  var q=quotes.findById(book.getQuoteId()).filter(x->userId.equals(x.getUserId())).orElseThrow(BookingLifecycleService::unavailable);
  return preview(book,q,clock.instant());
 }
 @Transactional
 public BookingResponse cancel(UUID userId,UUID bookingId,String reason,String key){
  if(reason!=null&&reason.length()>500)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  String normalized=reason==null||reason.isBlank()?null:reason.trim();
  record CancelPayload(UUID bookingId,String reason){}
  return idem.execute(userId,"booking:cancel",key,idem.fingerprint(new CancelPayload(bookingId,normalized)),BookingResponse.class,()->{
   var resources=locks.lockOwnedBooking(userId,bookingId);var book=resources.booking();var q=resources.quote();Instant now=clock.instant();
   if(book.getStatus()==BookingStatus.CANCELLED)return reads.response(book);
   if(expired(book,now)){expireLocked(book,now);return reads.response(book);}
   if(!preview(book,q,now).eligible())throw new BusinessException(ErrorCode.CANCELLATION_NOT_ALLOWED);
   boolean paid=book.getPaidAt()!=null;
   if(paid){
    refunds.request(userId,bookingId,q.getTotalCents());book.setRefundStatus("requested");
    events.publish("refund_requested",userId,bookingId,now);
   }else benefits.release(bookingId);
   book.setStatus(BookingStatus.CANCELLED);book.setCancellationReason(normalized);book.setCancelledAt(now);
   bookings.save(book);events.publish("booking_cancelled",userId,bookingId,now);
   return reads.response(book);
  });
 }
 @Transactional
 public boolean expirePending(UUID bookingId,Instant now){
  var initial=bookings.findById(bookingId).orElse(null);
  if(initial==null||!expired(initial,now))return false;
  var resource=locks.lockOwnedBooking(initial.getUserId(),bookingId);
  if(!expired(resource.booking(),now))return false;
  expireLocked(resource.booking(),now);return true;
 }
 private void expireLocked(Booking book,Instant now){
  benefits.release(book.getId());book.setStatus(BookingStatus.CANCELLED);book.setCancellationReason("payment_timeout");book.setCancelledAt(now);
  bookings.save(book);events.publish("booking_expired",book.getUserId(),book.getId(),now);
 }
 private static boolean expired(Booking book,Instant now){
  return book.getStatus()==BookingStatus.PENDING&&book.getPaidAt()==null&&"bank_transfer".equals(book.getPaymentMethod())
   &&book.getHoldExpiresAt()!=null&&!now.isBefore(book.getHoldExpiresAt());
 }
 private static CancellationPreview preview(Booking book,BookingQuote q,Instant now){
  boolean active=book.getStatus()==BookingStatus.PENDING||book.getStatus()==BookingStatus.CONFIRMED;
  boolean before=now.isBefore(q.getCheckIn().atTime(14,0).atZone(ZoneId.of(q.getTimezone())).toInstant());
  String reason=!active?"booking_not_active":expired(book,now)?"payment_timeout":!before?"check_in_started":null;
  boolean eligible=reason==null,paid=book.getPaidAt()!=null;
  String voucher=eligible&&q.getVoucherId()!=null?(paid?"after_refund_confirmation":"on_cancellation"):"none";
  return new CancellationPreview(eligible,reason,MoneyUsd.cents(eligible&&paid?q.getTotalCents():0),MoneyUsd.cents(0),
   eligible?q.getReservedPoints():0,voucher,eligible&&paid);
 }
 private static BusinessException unavailable(){return new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
}
