package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name="stayfinder.scheduling.enabled", havingValue="true", matchIfMissing=true)
public class BookingLifecycleScheduler {
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(BookingLifecycleScheduler.class);
    private final BookingRepository bookings;
    private final BookingLifecycleService lifecycle;
    private final BookingPolicy policy;
    public BookingLifecycleScheduler(BookingRepository bookings, BookingLifecycleService lifecycle, BookingPolicy policy) {
        this.bookings=bookings; this.lifecycle=lifecycle; this.policy=policy;
    }
    @Scheduled(fixedDelayString="${stayfinder.booking.lifecycle-delay-ms:60000}")
    public void tick() {
        // Bounded batches; each booking is processed in its own service transaction.
        bookings.findExpiredIds(BookingStatus.PENDING,policy.now(),PageRequest.of(0,100)).forEach(id -> process(id,false));
        bookings.findCompletableIds(BookingStatus.CONFIRMED,policy.completedThrough(),PageRequest.of(0,100)).forEach(id -> process(id,true));
    }
    private void process(java.util.UUID id,boolean complete) {
        try {
            if (complete) lifecycle.complete(id); else lifecycle.expire(id);
        } catch (RuntimeException failure) {
            // One quarantined legacy row must not prevent unrelated bookings in the batch from progressing.
            log.error("Booking lifecycle failed: bookingId={}, operation={}, errorType={}",id,complete?"complete":"expire",failure.getClass().getSimpleName());
        }
    }
}
