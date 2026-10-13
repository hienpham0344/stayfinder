package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.booking.mapper.BookingMapper;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.events.*;
import io.github.hienpham0344.stayfinder.common.idempotency.*;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.service.RoomAvailability;
import io.github.hienpham0344.stayfinder.reward.service.*;
import io.github.hienpham0344.stayfinder.snapshot.entity.*;
import io.github.hienpham0344.stayfinder.snapshot.repository.*;
import io.github.hienpham0344.stayfinder.snapshot.service.SnapshotService;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class BookingServiceTest {
 final UUID user=UUID.randomUUID(),quoteId=UUID.randomUUID(),roomId=UUID.randomUUID(),stayId=UUID.randomUUID(),rsId=UUID.randomUUID(),asId=UUID.randomUUID();
 final Clock clock=Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"),ZoneOffset.UTC);
 final BookingRepository bookings=mock(BookingRepository.class);final BookingDetailRepository details=mock(BookingDetailRepository.class);
 final BookingQuoteRepository quotes=mock(BookingQuoteRepository.class);final BookingTransactionLocks locks=mock(BookingTransactionLocks.class);
 final RoomAvailability inventory=mock(RoomAvailability.class);final RewardReservationOperations benefits=mock(RewardReservationOperations.class);
 final SnapshotService snapshots=mock(SnapshotService.class);final DomainEventPublisher events=mock(DomainEventPublisher.class);
 final RoomSnapshotRepository roomSnapshots=mock(RoomSnapshotRepository.class);final AccommodationSnapshotRepository staySnapshots=mock(AccommodationSnapshotRepository.class);
 final IdempotencyRepository idemRows=mock(IdempotencyRepository.class);final UserRepository users=mock(UserRepository.class);
 final Map<String,IdempotencyRecord> savedKeys=new HashMap<>();
 final IdempotencyService idem=new IdempotencyService(idemRows,users,mock(IdempotencyLockRepository.class),JsonMapper.builder().build(),clock);
 final BookingReadService reads=new BookingReadService(bookings,details,quotes,roomSnapshots,staySnapshots,Mappers.getMapper(BookingMapper.class),clock);
 final BookingServiceImpl service=new BookingServiceImpl(bookings,details,locks,inventory,snapshots,benefits,idem,events,reads,clock);
 BookingQuote q;Room room;Accommodation stay;Booking saved;BookingDetail savedDetail;
 @BeforeEach void setup(){
  User u=new User();u.setId(user);u.setCredentialState("active");when(users.findById(user)).thenReturn(Optional.of(u));
  when(idemRows.findByUserIdAndOperationAndRequestKey(any(),any(),any())).thenAnswer(i->Optional.ofNullable(savedKeys.get(i.getArgument(2))));
  when(idemRows.save(any())).thenAnswer(i->{IdempotencyRecord r=i.getArgument(0);savedKeys.put(r.getRequestKey(),r);return r;});
  q=new BookingQuote();q.setId(quoteId);q.setUserId(user);q.setRoomId(roomId);q.setAccommodationId(stayId);
  q.setCheckIn(LocalDate.of(2026,11,1));q.setCheckOut(q.getCheckIn().plusDays(3));q.setQuantity(1);q.setAdults(2);q.setChildren(0);
  q.setNights(3);q.setNightlyPriceCents(29900);q.setRoomSubtotalCents(89700);q.setCleaningFeeCents(10000);q.setServiceFeeCents(3500);
  q.setTotalCents(103200);q.setDiscountSource("none");q.setTimezone("Asia/Bangkok");q.setMaxGuestsPerRoom(2);
  q.setCreatedAt(clock.instant());q.setExpiresAt(clock.instant().plusSeconds(600));
  room=new Room();room.setId(roomId);room.setAccommodationId(stayId);room.setNightlyPriceCents(29900L);room.setStatus(RoomStatus.AVAILABLE);
  room.setStockTotal(3);room.setMaxGuestsPerRoom(2);
  stay=new Accommodation();stay.setId(stayId);stay.setStatus(AccommodationStatus.ACTIVE);stay.setTimezone("Asia/Bangkok");
  stay.setCleaningFeeCents(10000L);stay.setServiceFeeCents(3500L);q.setPriceVersion(BookingQuoteService.priceVersion(room,stay));
  when(locks.lockQuote(user,quoteId)).thenAnswer(i->new BookingTransactionLocks.QuoteResources(q,room,stay));
  when(inventory.remaining(eq(roomId),any(),any(),any())).thenReturn(3);
  when(benefits.preview(user,89700,null,0,clock.instant())).thenReturn(new RewardPolicy.DiscountPreview("none",0,0,null));
  when(snapshots.capture(roomId,stayId)).thenReturn(new SnapshotService.SnapshotReferences(rsId,asId));
  when(quotes.findById(quoteId)).thenReturn(Optional.of(q));
  when(bookings.save(any())).thenAnswer(i->{saved=i.getArgument(0);return saved;});
  when(details.save(any())).thenAnswer(i->{savedDetail=i.getArgument(0);return savedDetail;});
  when(details.findByBookingId(any())).thenAnswer(i->savedDetail==null?List.of():List.of(savedDetail));
  RoomSnapshot rs=new RoomSnapshot();rs.setId(rsId);rs.setSourceRoomId(roomId);rs.setName("Deluxe");rs.setImageUrls(new String[]{"https://example.test/room.jpg"});
  AccommodationSnapshot as=new AccommodationSnapshot();as.setId(asId);as.setSourceAccommodationId(stayId);as.setName("Riverside");as.setTimezone("Asia/Bangkok");
  when(roomSnapshots.findById(rsId)).thenReturn(Optional.of(rs));when(staySnapshots.findById(asId)).thenReturn(Optional.of(as));
 }
 CreateBookingRequest request(String method){return new CreateBookingRequest(quoteId,new GuestInformation(" Hien ","Hien@example.com","+84912345678"," Window please "),method);}
 @Test void propertyBookingIsConfirmedUnpaidAndCapturesQuoteGuestAndIndependentSnapshotIds(){
  var result=service.create(user,request("pay_at_property"),"create-1");
  assertEquals("confirmed",result.status());assertEquals("pending",result.paymentStatus());assertNull(result.holdExpiresAt());
  assertEquals("Hien",result.guest().fullName());assertEquals("hien@example.com",result.guest().email());assertEquals(103200,result.quote().total().amountCents());
  assertEquals(roomId,result.roomId());assertEquals("Riverside",result.stayName());assertNotEquals(roomId,savedDetail.getRoomSnapshotId());
  assertEquals(result.id(),q.getConsumedBookingId());assertNull(saved.getPaidAt());assertTrue(result.allowedActions().cancel());
  verify(benefits).reserve(eq(user),eq(quoteId),eq(result.id()),any());verify(benefits,never()).consume(any());
  verify(events).publish(eq("booking_created"),eq(user),eq(result.id()),eq(clock.instant()));
 }
 @Test void bankBookingHasServerFifteenMinuteDeadlineAndDoesNotManufactureSuccess(){
  var result=service.create(user,request("bank_transfer"),"create-1");
  assertEquals("pending",result.status());assertEquals("pending",result.paymentStatus());assertEquals(clock.instant().plusSeconds(900),result.holdExpiresAt());
 }
 @Test void uncertainResponseRetryReturnsSamePersistedBookingButKeyReuseForDifferentBodyConflicts(){
  var first=service.create(user,request("bank_transfer"),"create-1");
  var replay=service.create(user,request("bank_transfer"),"create-1");
  assertEquals(first,replay);verify(bookings,times(1)).save(any());verify(snapshots,times(1)).capture(any(),any());
  assertEquals(ErrorCode.IDEMPOTENCY_CONFLICT,assertThrows(BusinessException.class,()->service.create(user,request("pay_at_property"),"create-1")).getErrorCode());
 }
 @Test void expiredQuoteOrNewKeyForConsumedQuoteCannotCreateBooking(){
  q.setExpiresAt(clock.instant());
  assertEquals(ErrorCode.QUOTE_EXPIRED,assertThrows(BusinessException.class,()->service.create(user,request("bank_transfer"),"create-1")).getErrorCode());
  q.setExpiresAt(clock.instant().plusSeconds(600));q.setConsumedBookingId(UUID.randomUUID());
  assertEquals(ErrorCode.QUOTE_ALREADY_USED,assertThrows(BusinessException.class,()->service.create(user,request("bank_transfer"),"create-2")).getErrorCode());
  verifyNoInteractions(snapshots,events);verify(bookings,never()).save(any());
 }
 @Test void currentPriceCapacityTimezoneAndStockAreRevalidatedBeforeSnapshotsOrHold(){
  room.setNightlyPriceCents(30000L);
  assertEquals(ErrorCode.QUOTE_CHANGED,assertThrows(BusinessException.class,()->service.create(user,request("bank_transfer"),"create-1")).getErrorCode());
  room.setNightlyPriceCents(29900L);when(inventory.remaining(eq(roomId),any(),any(),any())).thenReturn(0);
  assertEquals(ErrorCode.ROOM_NOT_AVAILABLE,assertThrows(BusinessException.class,()->service.create(user,request("bank_transfer"),"create-2")).getErrorCode());
  verifyNoInteractions(snapshots,events);verify(benefits,never()).reserve(any(),any(),any(),any());
 }
 @Test void unsupportedMethodAndInvalidGuestCannotAcquireDomainLocksOrPersistAnything(){
  assertThrows(BusinessException.class,()->service.create(user,request("card"),"create-1"));
  var bad=new CreateBookingRequest(quoteId,new GuestInformation("","bad","123",null),"pay_at_property");
  assertThrows(BusinessException.class,()->service.create(user,bad,"create-2"));
  verifyNoInteractions(locks,snapshots,events);
 }
 @Test void aDifferentLockedRoomCannotAuthorizeSelectedInventory(){
  room.setId(UUID.randomUUID());
  assertEquals(ErrorCode.ROOM_NOT_AVAILABLE,assertThrows(BusinessException.class,()->service.create(user,request("pay_at_property"),"create-1")).getErrorCode());
  verifyNoInteractions(snapshots,events);
 }
 @Test void quoteOwnedBySomeoneElseCannotLeakOrCreateBooking(){
  q.setUserId(UUID.randomUUID());
  assertEquals(ErrorCode.QUOTE_NOT_FOUND,assertThrows(BusinessException.class,()->service.create(user,request("pay_at_property"),"create-1")).getErrorCode());
  verifyNoInteractions(snapshots,events);
 }
}
