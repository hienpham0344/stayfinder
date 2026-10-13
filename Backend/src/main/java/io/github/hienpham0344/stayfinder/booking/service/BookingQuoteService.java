package io.github.hienpham0344.stayfinder.booking.service;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.room.service.*;
import io.github.hienpham0344.stayfinder.room.dto.CancellationPolicyResponse;
import io.github.hienpham0344.stayfinder.reward.service.*;
import io.github.hienpham0344.stayfinder.booking.repository.BookingQuoteRepository;
import io.github.hienpham0344.stayfinder.booking.entity.BookingQuote;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.catalog.service.TripPriceCalculator;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.validation.SelectionPolicy;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;

@Service
public class BookingQuoteService {
 private final RoomRepository rooms;
 private final AccommodationRepository stays;
 private final RoomAvailability inventory;
 private final RewardReservationOperations rewards;
 private final BookingQuoteRepository quotes;
 private final Clock clock;
 public BookingQuoteService(RoomRepository rooms,AccommodationRepository stays,RoomAvailability inventory,
                            RewardReservationOperations rewards,BookingQuoteRepository quotes,Clock clock){
  this.rooms=rooms;this.stays=stays;this.inventory=inventory;this.rewards=rewards;this.quotes=quotes;this.clock=clock;
 }
 @Transactional
 public QuoteResponse create(UUID userId,QuoteRequest request){
  if(userId==null)throw new BusinessException(ErrorCode.UNAUTHORIZED);
  if(request==null)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  Accommodation stay=stays.findById(request.accommodationId()).filter(a->a.getStatus()==AccommodationStatus.ACTIVE)
    .orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
  Room room=rooms.findById(request.roomId()).filter(r->r.getStatus()==RoomStatus.AVAILABLE&&stay.getId().equals(r.getAccommodationId()))
    .orElseThrow(()->new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE));
  ZoneId timezone=timezone(stay);
  SelectionPolicy.validate(request.selection(),timezone,clock);
  if(request.requestedPoints()<0||request.requestedPoints()%100!=0)
    throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  validateSellablePricing(room,stay);
  if(room.getMaxGuestsPerRoom()==null||!RoomInventoryPolicy.fits(room.getMaxGuestsPerRoom(),request.quantity(),request.adults(),request.children())
    ||room.getStockTotal()==null||room.getStockTotal()<request.quantity())
    throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);
  Instant now=clock.instant();
  if(inventory.remaining(room.getId(),request.checkIn(),request.checkOut(),now)<request.quantity())
    throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);
  int nights=Math.toIntExact(ChronoUnit.DAYS.between(request.checkIn(),request.checkOut()));
  long subtotal=TripPriceCalculator.total(room.getNightlyPriceCents(),nights,request.quantity(),0,0).amountCents();
  long beforeDiscount=TripPriceCalculator.total(room.getNightlyPriceCents(),nights,request.quantity(),stay.getCleaningFeeCents(),stay.getServiceFeeCents()).amountCents();
  var discount=rewards.preview(userId,subtotal,request.voucherId(),request.requestedPoints(),now);
  if(discount==null||discount.discountCents()<0||discount.discountCents()>subtotal)
    throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
  BookingQuote quote=new BookingQuote();
  quote.setId(UUID.randomUUID());quote.setUserId(userId);quote.setAccommodationId(stay.getId());quote.setRoomId(room.getId());
  quote.setCheckIn(request.checkIn());quote.setCheckOut(request.checkOut());quote.setQuantity(request.quantity());
  quote.setAdults(request.adults());quote.setChildren(request.children());quote.setVoucherId(request.voucherId());
  quote.setRewardPoints(request.requestedPoints());quote.setReservedPoints(discount.reservedPoints());quote.setDiscountSource(discount.source());
  quote.setNights(nights);quote.setPriceVersion(priceVersion(room,stay));quote.setNightlyPriceCents(room.getNightlyPriceCents());
  quote.setRoomSubtotalCents(subtotal);quote.setCleaningFeeCents(stay.getCleaningFeeCents());quote.setServiceFeeCents(stay.getServiceFeeCents());
  quote.setTaxCents(0);quote.setDiscountCents(discount.discountCents());quote.setTotalCents(beforeDiscount-discount.discountCents());
  quote.setTimezone(timezone.getId());quote.setMaxGuestsPerRoom(room.getMaxGuestsPerRoom());
  quote.setCreatedAt(now);quote.setExpiresAt(now.plusSeconds(600));
  quotes.save(quote);
  return response(quote);
 }
 public static ZoneId timezone(Accommodation stay){
  try{return ZoneId.of(Objects.requireNonNull(stay.getTimezone()));}
  catch(DateTimeException|NullPointerException e){throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
 }
 public static void validateSellablePricing(Room room,Accommodation stay){
  if(room.getNightlyPriceCents()==null||stay.getCleaningFeeCents()==null||stay.getServiceFeeCents()==null)
    throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);
  try{MoneyUsd.cents(room.getNightlyPriceCents());MoneyUsd.cents(stay.getCleaningFeeCents());MoneyUsd.cents(stay.getServiceFeeCents());}
  catch(IllegalArgumentException e){throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);}
 }
 // Display version is a JS-safe fingerprint. Booking acceptance also compares every captured term, so it does not rely on hash uniqueness.
 public static long priceVersion(Room room,Accommodation stay){
  String terms=room.getNightlyPriceCents()+"|"+stay.getCleaningFeeCents()+"|"+stay.getServiceFeeCents()+"|"
    +room.getMaxGuestsPerRoom()+"|"+stay.getTimezone()+"|USD|tax=0|freeBeforeCheckIn=14:00|checkout=11:00";
  try{
   long value=ByteBuffer.wrap(MessageDigest.getInstance("SHA-256").digest(terms.getBytes(StandardCharsets.UTF_8))).getLong()&9_007_199_254_740_991L;
   return value==0?1:value;
  }catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}
 }
 public static QuoteResponse response(BookingQuote q){
  return new QuoteResponse(q.getId(),q.getAccommodationId(),q.getRoomId(),q.getCheckIn(),q.getCheckOut(),
   q.getQuantity(),q.getAdults(),q.getChildren(),q.getVoucherId(),q.getRewardPoints(),q.getExpiresAt(),q.getNights(),q.getPriceVersion(),
   MoneyUsd.cents(q.getNightlyPriceCents()),MoneyUsd.cents(q.getRoomSubtotalCents()),MoneyUsd.cents(q.getCleaningFeeCents()),
   MoneyUsd.cents(q.getServiceFeeCents()),MoneyUsd.cents(q.getTaxCents()),MoneyUsd.cents(q.getDiscountCents()),MoneyUsd.cents(q.getTotalCents()),
   q.getDiscountSource(),new CancellationPolicyResponse(true,"14:00",q.getTimezone()));
 }
}
