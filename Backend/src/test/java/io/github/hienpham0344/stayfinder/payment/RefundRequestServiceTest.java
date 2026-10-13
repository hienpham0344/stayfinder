package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.payment.entity.*;
import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.payment.service.RefundRequestService;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class RefundRequestServiceTest {
 @Test void requestIsOnceAndLinksExactSuccessfulCollectionWithoutDeclaringRefunded(){
  var payments=mock(PaymentRepository.class);var rows=mock(RefundRequestRepository.class);UUID owner=UUID.randomUUID(),booking=UUID.randomUUID(),paymentId=UUID.randomUUID();
  Payment paid=new Payment();paid.setId(paymentId);paid.setBookingId(booking);paid.setStatus(PaymentStatus.SUCCESS);paid.setAmount(new BigDecimal("1032.00"));
  when(payments.findByBookingId(booking)).thenReturn(List.of(paid));
  Map<UUID,RefundRequest> persisted=new HashMap<>();when(rows.findByBookingId(booking)).thenAnswer(i->Optional.ofNullable(persisted.get(booking)));
  when(rows.save(any())).thenAnswer(i->{RefundRequest r=i.getArgument(0);persisted.put(r.getBookingId(),r);return r;});
  var service=new RefundRequestService(payments,rows,Clock.systemUTC());
  service.request(owner,booking,103200);service.request(owner,booking,103200);
  assertEquals(1,persisted.size());assertEquals("requested",persisted.get(booking).getStatus());
  assertEquals(paymentId,persisted.get(booking).getPaymentId());assertEquals(103200,persisted.get(booking).getAmountUsdCents());
  assertEquals(PaymentStatus.SUCCESS,paid.getStatus());assertThrows(BusinessException.class,()->service.request(owner,booking,1));
 }
 @Test void pendingOrMismatchedCollectionCannotAuthorizeRefundRequest(){
  var payments=mock(PaymentRepository.class);var rows=mock(RefundRequestRepository.class);UUID booking=UUID.randomUUID();
  Payment p=new Payment();p.setStatus(PaymentStatus.PENDING);p.setAmount(new BigDecimal("1032.00"));
  when(payments.findByBookingId(booking)).thenReturn(List.of(p));
  var service=new RefundRequestService(payments,rows,Clock.systemUTC());
  assertThrows(BusinessException.class,()->service.request(UUID.randomUUID(),booking,103200));verify(rows,never()).save(any());
 }
}
