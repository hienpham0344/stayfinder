package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.booking.service.BookingTransactionLocks;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.reward.service.RewardWalletLocks;
import jakarta.persistence.*;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class BookingLockRefreshTest {
 @Test void stateLoadedBeforeWaitingForWalletIsRefreshedUnderLocks(){
  var wallets=mock(RewardWalletLocks.class);var rooms=mock(RoomRepository.class);var stays=mock(AccommodationRepository.class);
  var books=mock(BookingRepository.class);var quotes=mock(BookingQuoteRepository.class);var em=mock(EntityManager.class);
  UUID user=UUID.randomUUID(),qid=UUID.randomUUID(),rid=UUID.randomUUID(),aid=UUID.randomUUID(),bid=UUID.randomUUID();
  BookingQuote q=new BookingQuote();q.setId(qid);q.setUserId(user);q.setRoomId(rid);q.setAccommodationId(aid);
  Room room=new Room();Accommodation stay=new Accommodation();Booking book=new Booking();book.setId(bid);book.setUserId(user);book.setQuoteId(qid);
  when(quotes.findById(qid)).thenReturn(Optional.of(q));when(quotes.lockOwned(qid,user)).thenReturn(Optional.of(q));
  when(rooms.lockById(rid)).thenReturn(Optional.of(room));when(stays.lockById(aid)).thenReturn(Optional.of(stay));
  when(books.findByIdAndUserId(bid,user)).thenReturn(Optional.of(book));when(books.lockOwned(bid,user)).thenReturn(Optional.of(book));
  // Model current DB values arriving only on refresh of an already-managed entity.
  doAnswer(i->{q.setConsumedBookingId(bid);return null;}).when(em).refresh(q,LockModeType.PESSIMISTIC_WRITE);
  Instant paid=Instant.parse("2026-10-13T12:00:00Z");
  doAnswer(i->{book.setPaidAt(paid);return null;}).when(em).refresh(book,LockModeType.PESSIMISTIC_WRITE);
  var locks=new BookingTransactionLocks(wallets,rooms,stays,books,quotes,em);
  assertEquals(bid,locks.lockQuote(user,qid).quote().getConsumedBookingId());
  assertEquals(paid,locks.lockOwnedBooking(user,bid).booking().getPaidAt());
 }
}
