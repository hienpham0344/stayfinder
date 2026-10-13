package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import org.springframework.stereotype.Component;import org.springframework.scheduling.annotation.Scheduled;import org.springframework.data.domain.PageRequest;
import org.slf4j.*;import java.time.Clock;
@Component
public class CompletedStayWorker {
 private static final Logger log=LoggerFactory.getLogger(CompletedStayWorker.class);
 private final BookingRepository rows;private final CompletedStayService lifecycle;private final Clock clock;
 public CompletedStayWorker(BookingRepository rows,CompletedStayService lifecycle,Clock clock){this.rows=rows;this.lifecycle=lifecycle;this.clock=clock;}
 @Scheduled(fixedDelayString="${stayfinder.workers.completion-delay-ms:60000}") public void runOnce(){
  var now=clock.instant();for(var id:rows.findCompletionCandidateIds(now,PageRequest.of(0,100))){
   try{lifecycle.completeEligible(id,now);}catch(RuntimeException e){log.warn("Booking completion deferred ({})",e.getClass().getSimpleName());}
  }
 }
}
