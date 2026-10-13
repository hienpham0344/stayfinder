package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.booking.dto.QuoteRequest;
import io.github.hienpham0344.stayfinder.booking.entity.BookingQuote;
import io.github.hienpham0344.stayfinder.booking.repository.BookingQuoteRepository;
import io.github.hienpham0344.stayfinder.booking.service.BookingQuoteService;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.reward.service.*;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomAvailability;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class BookingQuoteServiceTest {
 final UUID user=UUID.randomUUID(),stayId=UUID.randomUUID(),roomId=UUID.randomUUID();
 final Clock clock=Clock.fixed(Instant.parse("2026-10-13T18:00:00Z"),ZoneOffset.UTC);
 final LocalDate in=LocalDate.of(2026,11,1),out=in.plusDays(3);
 final RoomRepository rooms=mock(RoomRepository.class);
 final AccommodationRepository stays=mock(AccommodationRepository.class);
 final RoomAvailability inventory=mock(RoomAvailability.class);
 final RewardReservationOperations rewards=mock(RewardReservationOperations.class);
 final BookingQuoteRepository quotes=mock(BookingQuoteRepository.class);
 final BookingQuoteService service=new BookingQuoteService(rooms,stays,inventory,rewards,quotes,clock);
 Room room; Accommodation stay;
 @BeforeEach void setup(){
  stay=new Accommodation();stay.setId(stayId);stay.setStatus(AccommodationStatus.ACTIVE);
  stay.setTimezone("Asia/Bangkok");stay.setCleaningFeeCents(10000L);stay.setServiceFeeCents(3500L);
  room=new Room();room.setId(roomId);room.setAccommodationId(stayId);room.setStatus(RoomStatus.AVAILABLE);
  room.setNightlyPriceCents(29900L);room.setStockTotal(3);room.setMaxGuestsPerRoom(2);
  when(stays.findById(stayId)).thenReturn(Optional.of(stay));
  when(rooms.findById(roomId)).thenReturn(Optional.of(room));
  when(inventory.remaining(eq(roomId),any(),any(),any())).thenReturn(3);
  when(rewards.preview(eq(user),anyLong(),isNull(),eq(0L),any())).thenReturn(new RewardPolicy.DiscountPreview("none",0,0,null));
  when(quotes.save(any())).thenAnswer(i->i.getArgument(0));
 }
 QuoteRequest request(LocalDate start,LocalDate end,int quantity,int adults,int children,UUID voucher,Integer points){
  return new QuoteRequest(stayId,roomId,start,end,quantity,adults,children,voucher,points==null?null:points.longValue());
 }
 @Test void calculatesServerUsdLineItemsAndPersistsTenMinuteQuoteWithoutHoldingAnything(){
  var result=service.create(user,request(in,out,1,2,0,null,null));
  assertEquals(29900,result.nightlyPrice().amountCents());assertEquals(89700,result.roomSubtotal().amountCents());
  assertEquals(10000,result.cleaningFee().amountCents());assertEquals(3500,result.serviceFee().amountCents());
  assertEquals(0,result.tax().amountCents());assertEquals(103200,result.total().amountCents());
  assertEquals("USD",result.total().currency());assertEquals(3,result.nights());
  assertEquals(clock.instant().plusSeconds(600),result.expiresAt());assertTrue(result.priceVersion()>0);
  assertEquals("14:00",result.cancellationPolicy().checkInLocalTime());assertTrue(result.cancellationPolicy().freeBeforeCheckIn());
  var captured=ArgumentCaptor.forClass(BookingQuote.class);verify(quotes).save(captured.capture());
  assertEquals(user,captured.getValue().getUserId());assertNull(captured.getValue().getConsumedBookingId());
  verify(rewards,never()).reserve(any(),any(),any(),any());
 }
 @Test void multipliesOnlyRoomSubtotalByQuantityAndUsesDiscountPreview(){
  when(rewards.preview(user,179400,null,2000,clock.instant())).thenReturn(new RewardPolicy.DiscountPreview("points",2000,2000,null));
  var quote=service.create(user,request(in,out,2,3,1,null,2000));
  assertEquals(179400,quote.roomSubtotal().amountCents());assertEquals(190900,quote.total().amountCents());
  assertEquals(2000,quote.discount().amountCents());assertEquals("points",quote.discountSource());
 }
 @Test void appliesOwnedVoucherAndNeverAcceptsAnUnverifiedDiscount(){
  UUID voucher=UUID.randomUUID();
  when(rewards.preview(user,89700,voucher,0,clock.instant())).thenReturn(new RewardPolicy.DiscountPreview("voucher",2500,0,voucher));
  var result=service.create(user,request(in,out,1,1,0,voucher,0));
  assertEquals(voucher,result.voucherId());assertEquals(100700,result.total().amountCents());assertEquals("voucher",result.discountSource());
  when(rewards.preview(user,89700,voucher,0,clock.instant())).thenThrow(new BusinessException(ErrorCode.VOUCHER_EXPIRED));
  assertEquals(ErrorCode.VOUCHER_EXPIRED,assertThrows(BusinessException.class,()->service.create(user,request(in,out,1,1,0,voucher,0))).getErrorCode());
 }
 @Test void countsChildrenAndRoomQuantityAgainstCapacity(){
  assertEquals(ErrorCode.ROOM_NOT_AVAILABLE,assertThrows(BusinessException.class,()->service.create(user,request(in,out,1,2,1,null,null))).getErrorCode());
  assertDoesNotThrow(()->service.create(user,request(in,out,2,2,2,null,null)));
 }
 @Test void refusesScarceStockAndCrossStayRoom(){
  when(inventory.remaining(eq(roomId),any(),any(),any())).thenReturn(0);
  assertEquals(ErrorCode.ROOM_NOT_AVAILABLE,assertThrows(BusinessException.class,()->service.create(user,request(in,out,1,1,0,null,null))).getErrorCode());
  room.setAccommodationId(UUID.randomUUID());
  assertThrows(BusinessException.class,()->service.create(user,request(in,out,1,1,0,null,null)));
  verifyNoInteractions(quotes);
 }
 @Test void validatesDatesUsingStayTimezoneAndNinetyNightLimit(){
  // UTC is Oct 13; stay-local date is already Oct 14.
  assertThrows(BusinessException.class,()->service.create(user,request(LocalDate.of(2026,10,13),in,1,1,0,null,null)));
  assertThrows(BusinessException.class,()->service.create(user,request(in,in.plusDays(91),1,1,0,null,null)));
  assertThrows(BusinessException.class,()->service.create(user,request(in,in,1,1,0,null,null)));
  assertThrows(BusinessException.class,()->service.create(user,request(in,out,0,1,0,null,null)));
  assertThrows(BusinessException.class,()->service.create(user,request(in,out,1,1,0,null,-100)));
  verifyNoInteractions(quotes);
 }
 @Test void refusesUnknownPricingAndUnsafeAmountInsteadOfConvertingLegacyPrices(){
  room.setNightlyPriceCents(null);
  assertThrows(BusinessException.class,()->service.create(user,request(in,out,1,1,0,null,null)));
  room.setNightlyPriceCents(9_007_199_254_740_991L);
  assertThrows(BusinessException.class,()->service.create(user,request(in,out,1,1,0,null,null)));
  room.setNightlyPriceCents(29900L);stay.setCleaningFeeCents(null);
  assertThrows(BusinessException.class,()->service.create(user,request(in,out,1,1,0,null,null)));
  verifyNoInteractions(quotes);
 }
 @Test void longAvailablePointRequestCanBeCappedToExactRoomDiscountWithoutIntOverflow(){
  room.setNightlyPriceCents(1_000_000_000L);
  when(rewards.preview(user,3_000_000_000L,null,3_000_000_000L,clock.instant())).thenReturn(new RewardPolicy.DiscountPreview("points",600_000_000L,600_000_000L,null));
  var result=service.create(user,new QuoteRequest(stayId,roomId,in,out,1,1,0,null,3_000_000_000L));
  assertEquals(3_000_000_000L,result.rewardPoints());assertEquals(600_000_000L,result.discount().amountCents());
  assertEquals(2_400_013_500L,result.total().amountCents());
 }
 @Test void quotesKeepOldAmountsWhenCatalogChangesAndNewQuotesExposeDifferentVersion(){
  var before=service.create(user,request(in,out,1,1,0,null,null));
  room.setNightlyPriceCents(30000L);
  var after=service.create(user,request(in,out,1,1,0,null,null));
  assertEquals(103200,before.total().amountCents());assertEquals(103500,after.total().amountCents());
  assertNotEquals(before.priceVersion(),after.priceVersion());
 }
}
