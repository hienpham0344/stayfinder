package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.reward.service.RewardWalletLocks;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.UUID;
@Service @Transactional(propagation=Propagation.MANDATORY)
public class BookingTransactionLocks {
 public record QuoteResources(BookingQuote quote,Room room,Accommodation accommodation){}
 public record BookingResources(Booking booking,BookingQuote quote){}
 private final RewardWalletLocks wallets;private final RoomRepository rooms;private final AccommodationRepository stays;
 private final BookingRepository bookings;private final BookingQuoteRepository quotes;private final jakarta.persistence.EntityManager entityManager;
 public BookingTransactionLocks(RewardWalletLocks wallets,RoomRepository rooms,AccommodationRepository stays,BookingRepository bookings,BookingQuoteRepository quotes,jakarta.persistence.EntityManager entityManager){
  this.wallets=wallets;this.rooms=rooms;this.stays=stays;this.bookings=bookings;this.quotes=quotes;this.entityManager=entityManager;
 }
 // Request advisory key -> owner user/wallet -> source room -> accommodation (create only) -> quote/booking -> payment/claim/refund.
 public QuoteResources lockQuote(UUID userId,UUID quoteId){
  var initial=quotes.findById(quoteId).filter(q->userId.equals(q.getUserId())).orElseThrow(()->new BusinessException(ErrorCode.QUOTE_NOT_FOUND));
  wallets.lock(userId);
  var room=rooms.lockById(initial.getRoomId()).orElseThrow(()->new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE));
  var stay=stays.lockById(initial.getAccommodationId()).orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
  var quote=quotes.lockOwned(quoteId,userId).orElseThrow(()->new BusinessException(ErrorCode.QUOTE_NOT_FOUND));
  // Lock queries do not replace state of an entity already managed before the wait.
  entityManager.refresh(room,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
  entityManager.refresh(stay,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
  entityManager.refresh(quote,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
  return new QuoteResources(quote,room,stay);
 }
 public BookingResources lockOwnedBooking(UUID userId,UUID bookingId){
  var initial=bookings.findByIdAndUserId(bookingId,userId).orElseThrow(()->new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
  if(initial.getQuoteId()==null)throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
  var q=quotes.findById(initial.getQuoteId()).filter(x->userId.equals(x.getUserId())).orElseThrow(()->new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE));
  wallets.lock(userId);
  // A deleted live room cannot prevent release/refund of the immutable owned booking.
  rooms.lockById(q.getRoomId());
  var locked=bookings.lockOwned(bookingId,userId).orElseThrow(()->new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
  entityManager.refresh(locked,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
  return new BookingResources(locked,q);
 }
}
