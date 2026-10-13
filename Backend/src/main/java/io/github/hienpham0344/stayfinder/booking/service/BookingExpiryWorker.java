package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.PageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Clock;
@Component
public class BookingExpiryWorker {
 private static final Logger log=LoggerFactory.getLogger(BookingExpiryWorker.class);
 private final BookingRepository bookings;private final BookingLifecycleService lifecycle;private final Clock clock;
 public BookingExpiryWorker(BookingRepository bookings,BookingLifecycleService lifecycle,Clock clock){this.bookings=bookings;this.lifecycle=lifecycle;this.clock=clock;}
 @Scheduled(fixedDelayString="${stayfinder.workers.expiry-delay-ms:60000}")
 public void runOnce(){
  var now=clock.instant();
  for(var id:bookings.findExpiredPendingIds(now,PageRequest.of(0,100))){
   try{lifecycle.expirePending(id,now);}
   catch(RuntimeException e){log.warn("Booking expiry deferred ({})",e.getClass().getSimpleName());}
  }
 }
}
