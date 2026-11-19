package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.service.BookingPolicy;
import org.junit.jupiter.api.Test;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;
class BookingPolicyTest {
    @Test void expiryIsInclusiveAndDoesNotDependOnScheduler() {
        Instant now=Instant.parse("2030-06-01T00:00:00Z");Booking booking=new Booking();booking.setExpiresAt(now);
        BookingPolicy policy=new BookingPolicy(Clock.fixed(now,ZoneOffset.UTC),15,"Asia/Ho_Chi_Minh","12:00");
        assertTrue(policy.expired(booking));assertEquals(now.plusSeconds(900),policy.newExpiry());
    }
    @Test void checkoutBoundaryUsesVietnamTimeRatherThanHostZone() {
        Instant before=Instant.parse("2030-06-01T04:59:59Z");
        assertEquals(LocalDate.of(2030,5,31),new BookingPolicy(Clock.fixed(before,ZoneOffset.UTC),15,"Asia/Ho_Chi_Minh","12:00").completedThrough());
        assertEquals(LocalDate.of(2030,6,1),new BookingPolicy(Clock.fixed(before.plusSeconds(1),ZoneOffset.UTC),15,"Asia/Ho_Chi_Minh","12:00").completedThrough());
    }
}
