package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.mapper.PaymentMapper;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.payment.service.*;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import tools.jackson.databind.json.JsonMapper;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class PaymentServiceTest {
 final PaymentRepository rows=mock(PaymentRepository.class);
 final io.github.hienpham0344.stayfinder.booking.repository.BookingRepository bookings=mock(io.github.hienpham0344.stayfinder.booking.repository.BookingRepository.class);
 final BookingTransactionLocks locks=mock(BookingTransactionLocks.class);
 final IdempotencyService idem=mock(IdempotencyService.class);
 final Clock clock=Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"),ZoneOffset.UTC);
 final SepayWebhookAuthenticator auth=new SepayWebhookAuthenticator("fixture-only-sepay-hmac-secret-32bytes",clock);
 final SepayNativePayloadParser parser=new SepayNativePayloadParser(JsonMapper.builder().build());
 final PaymentProvider provider=provider("25000","fixture-v1");
 final PaymentMapper mapper=Mappers.getMapper(PaymentMapper.class);
 final PaymentServiceImpl service=new PaymentServiceImpl(rows,locks,idem,provider,mapper,clock,bookings);
 final UUID owner=UUID.randomUUID(),bookId=UUID.randomUUID();
 final Booking book=new Booking();
 @BeforeEach void setUp(){
  book.setId(bookId);book.setUserId(owner);book.setQuoteId(UUID.randomUUID());book.setTotalPriceCents(103200L);
  book.setPaymentMethod("bank_transfer");book.setStatus(BookingStatus.PENDING);book.setPaymentStatus("pending");book.setRefundStatus("none");
  book.setCreatedAt(clock.instant());book.setHoldExpiresAt(clock.instant().plusSeconds(900));
  var quote=new BookingQuote();quote.setTotalCents(103200L);
  when(locks.lockOwnedBooking(owner,bookId)).thenReturn(new BookingTransactionLocks.BookingResources(book,quote));
  when(idem.fingerprint(any())).thenReturn("a".repeat(64));
  when(idem.execute(eq(owner),eq("payment:create"),anyString(),anyString(),eq(io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse.class),any()))
   .thenAnswer(i->((Supplier<?>)i.getArgument(5)).get());
  when(rows.findByBookingId(bookId)).thenReturn(List.of());
  when(rows.save(any(Payment.class))).thenAnswer(i->i.getArgument(0));
 }
 PaymentProvider provider(String rate,String version){
  return new SepayPaymentProvider(true,"MBBank","MB","000123456789","Synthetic holder",null,auth,parser,new SettlementRateService(new BigDecimal(rate),version));
 }
 @Test void bankInstructionsLockUsdVndReferenceAccountAndDeadline(){
  var response=service.create(owner,bookId,"bank_transfer","fixture-key");
  assertEquals(103200,response.originalAmount().amountCents());assertEquals("USD",response.originalAmount().currency());
  assertEquals(25800000,response.settlement().amount());assertEquals("25000",response.settlement().usdToVndRate());
  assertEquals("test",response.settlement().environment());assertEquals("pending",response.status());
  assertEquals(book.getHoldExpiresAt(),response.expiresAt());
  assertTrue(response.settlement().transferReference().matches("SF[A-Z0-9]{10}"));
  assertTrue(response.settlement().qrImageUrl().startsWith("https://vietqr.app/img?"));
  verify(rows).save(argThat(p->p.getUserId().equals(owner)&&p.getOriginalAmountCents()==103200));
 }
 @Test void existingInstructionsNeverUseChangedConfiguration(){
  var first=service.create(owner,bookId,"bank_transfer","first");
  var captor=org.mockito.ArgumentCaptor.forClass(Payment.class);verify(rows).save(captor.capture());
  when(rows.findByBookingId(bookId)).thenReturn(List.of(captor.getValue()));
  var changed=new PaymentServiceImpl(rows,locks,idem,provider("30000","fixture-v2"),mapper,clock,bookings);
  var second=changed.create(owner,bookId,"bank_transfer","different-key");
  assertEquals(first,second);assertEquals("fixture-v1",second.settlement().rateVersion());verify(rows,times(1)).save(any());
 }
 @Test void propertyLedgerIsPendingWithNoConversion(){
  book.setPaymentMethod("pay_at_property");book.setStatus(BookingStatus.CONFIRMED);book.setHoldExpiresAt(null);
  var response=service.create(owner,bookId,"pay_at_property","property");
  assertNull(response.settlement());assertNull(response.expiresAt());assertEquals("pending",response.status());assertNull(book.getPaidAt());
 }
 @Test void immutableMethodExpiredCancelledAndUnsupportedAreRejected(){
  assertThrows(BusinessException.class,()->service.create(owner,bookId,"pay_at_property","method"));
  book.setHoldExpiresAt(clock.instant());assertThrows(BusinessException.class,()->service.create(owner,bookId,"bank_transfer","expired"));
  book.setStatus(BookingStatus.CANCELLED);assertThrows(BusinessException.class,()->service.create(owner,bookId,"bank_transfer","cancelled"));
  assertThrows(BusinessException.class,()->service.create(owner,bookId,"card","unsupported"));
  verify(rows,never()).save(any());
 }
 @Test void getHidesOtherOwnersAndReturnsOnlyClassifiedPayment(){
  when(rows.findByIdAndUserId(any(),eq(owner))).thenReturn(Optional.empty());
  assertEquals(ErrorCode.PAYMENT_NOT_FOUND,assertThrows(BusinessException.class,()->service.getOwned(owner,UUID.randomUUID())).getErrorCode());
 }
}
