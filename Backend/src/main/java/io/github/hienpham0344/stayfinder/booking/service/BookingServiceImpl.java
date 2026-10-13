package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.common.validation.SelectionPolicy;
import io.github.hienpham0344.stayfinder.room.service.*;
import io.github.hienpham0344.stayfinder.reward.service.*;
import io.github.hienpham0344.stayfinder.snapshot.service.SnapshotService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
public class BookingServiceImpl implements BookingService {
 private final BookingRepository bookings;private final BookingDetailRepository details;private final BookingTransactionLocks locks;
 private final RoomAvailability inventory;private final SnapshotService snapshots;private final RewardReservationOperations benefits;
 private final IdempotencyService idem;private final DomainEventPublisher events;private final BookingReadService reads;private final Clock clock;
 public BookingServiceImpl(BookingRepository bookings,BookingDetailRepository details,BookingTransactionLocks locks,RoomAvailability inventory,
  SnapshotService snapshots,RewardReservationOperations benefits,IdempotencyService idem,DomainEventPublisher events,BookingReadService reads,Clock clock){
  this.bookings=bookings;this.details=details;this.locks=locks;this.inventory=inventory;this.snapshots=snapshots;this.benefits=benefits;
  this.idem=idem;this.events=events;this.reads=reads;this.clock=clock;
 }
 @Override @Transactional(readOnly=true)
 public PageResponse<BookingResponse> list(UUID userId,BookingStatus status,Pageable pageable){
  var page=status==null?bookings.findByUserId(userId,pageable):bookings.findByUserIdAndStatus(userId,status,pageable);
  return PageResponse.from(page.map(reads::response));
 }
 @Override @Transactional(readOnly=true)
 public BookingResponse get(UUID userId,UUID id){return reads.owned(userId,id);}
 @Override @Transactional
 public BookingResponse create(UUID userId,CreateBookingRequest request,String key){
  if(request==null||request.quoteId()==null||request.guest()==null
   ||!Set.of("bank_transfer","pay_at_property").contains(Objects.toString(request.paymentMethod(),"")))throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  request.guest().validate();
  return idem.execute(userId,"booking:create",key,idem.fingerprint(request),BookingResponse.class,()->createOnce(userId,request));
 }
 private BookingResponse createOnce(UUID userId,CreateBookingRequest request){
  var resource=locks.lockQuote(userId,request.quoteId());var q=resource.quote();var room=resource.room();var stay=resource.accommodation();
  if(!userId.equals(q.getUserId()))throw new BusinessException(ErrorCode.QUOTE_NOT_FOUND);
  Instant now=clock.instant();
  if(q.getConsumedBookingId()!=null)throw new BusinessException(ErrorCode.QUOTE_ALREADY_USED);
  if(!now.isBefore(q.getExpiresAt()))throw new BusinessException(ErrorCode.QUOTE_EXPIRED);
  SelectionPolicy.validate(new io.github.hienpham0344.stayfinder.common.dto.QuoteSelection(q.getAccommodationId(),q.getRoomId(),
   q.getCheckIn(),q.getCheckOut(),q.getQuantity(),q.getAdults(),q.getChildren()),BookingQuoteService.timezone(stay),clock);
  BookingQuoteService.validateSellablePricing(room,stay);
  if(room.getStatus()!=RoomStatus.AVAILABLE||stay.getStatus()!=AccommodationStatus.ACTIVE||!q.getAccommodationId().equals(room.getAccommodationId()))
   throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);
  if(q.getNightlyPriceCents()!=room.getNightlyPriceCents()||q.getCleaningFeeCents()!=stay.getCleaningFeeCents()
   ||q.getServiceFeeCents()!=stay.getServiceFeeCents()||q.getTaxCents()!=0||room.getMaxGuestsPerRoom()==null
   ||q.getMaxGuestsPerRoom()!=room.getMaxGuestsPerRoom()||!q.getTimezone().equals(stay.getTimezone())
   ||q.getPriceVersion()!=BookingQuoteService.priceVersion(room,stay))throw new BusinessException(ErrorCode.QUOTE_CHANGED);
  if(!RoomInventoryPolicy.fits(room.getMaxGuestsPerRoom(),q.getQuantity(),q.getAdults(),q.getChildren())
   ||inventory.remaining(q.getRoomId(),q.getCheckIn(),q.getCheckOut(),now)<q.getQuantity())throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);
  var preview=benefits.preview(userId,q.getRoomSubtotalCents(),q.getVoucherId(),q.getRewardPoints(),now);
  if(preview.discountCents()!=q.getDiscountCents()||preview.reservedPoints()!=q.getReservedPoints()
   ||!Objects.equals(preview.source(),q.getDiscountSource())||!Objects.equals(preview.voucherClaimId(),q.getVoucherId()))
   throw new BusinessException(ErrorCode.QUOTE_CHANGED);
  var refs=snapshots.capture(q.getRoomId(),q.getAccommodationId());
  Booking booking=new Booking();booking.setId(UUID.randomUUID());booking.setUserId(userId);booking.setQuoteId(q.getId());
  booking.setConfirmationCode("SF"+booking.getId().toString().replace("-","").substring(0,16).toUpperCase(Locale.ROOT));
  booking.setTotalPriceCents(q.getTotalCents());booking.setTotalPrice(BigDecimal.valueOf(q.getTotalCents(),2));
  booking.setPaymentMethod(request.paymentMethod());booking.setCreatedAt(now);booking.setPaymentStatus("pending");booking.setRefundStatus("none");
  boolean bank="bank_transfer".equals(request.paymentMethod());
  booking.setStatus(bank?BookingStatus.PENDING:BookingStatus.CONFIRMED);booking.setHoldExpiresAt(bank?now.plusSeconds(900):null);
  var guest=request.guest();booking.setGuestFullName(guest.fullName());booking.setGuestEmail(guest.email());booking.setGuestPhone(guest.phone());booking.setGuestSpecialRequest(guest.specialRequest());
  bookings.save(booking);
  BookingDetail detail=new BookingDetail();detail.setId(UUID.randomUUID());detail.setBookingId(booking.getId());detail.setRoomSnapshotId(refs.roomSnapshotId());
  detail.setAccommodationSnapshotId(refs.accommodationSnapshotId());detail.setCheckInDate(q.getCheckIn());detail.setCheckOutDate(q.getCheckOut());
  detail.setQuantity(q.getQuantity());detail.setSubtotal(BigDecimal.valueOf(q.getRoomSubtotalCents(),2));details.save(detail);
  benefits.reserve(userId,q.getId(),booking.getId(),preview);q.setConsumedBookingId(booking.getId());
  events.publish("booking_created",userId,booking.getId(),now);
  return reads.response(booking);
 }
}
