package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.*;
class BookingLifecycleSchedulerTest {
    @Test void failedBookingDoesNotBlockOtherBookingsInBatch() {
        BookingRepository bookings=mock(BookingRepository.class);BookingLifecycleService lifecycle=mock(BookingLifecycleService.class);
        BookingPolicy policy=new BookingPolicy(Clock.fixed(Instant.parse("2030-06-01T05:00:00Z"),ZoneOffset.UTC),15,"Asia/Ho_Chi_Minh","12:00");
        UUID first=UUID.randomUUID(),second=UUID.randomUUID();when(bookings.findCompletableIds(any(),any(),any())).thenReturn(List.of(first,second));
        doThrow(new IllegalStateException("must not be logged")).when(lifecycle).complete(first);
        new BookingLifecycleScheduler(bookings,lifecycle,policy).tick();verify(lifecycle).complete(second);
    }
}
