package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.time.*;

@Component
public class BookingPolicy {
    private final Clock clock;
    private final Duration holdDuration;
    private final ZoneId zone;
    private final LocalTime checkoutTime;
    public BookingPolicy(Clock clock, @Value("${stayfinder.booking.hold-minutes:15}") long holdMinutes,
                         @Value("${stayfinder.booking.zone:Asia/Ho_Chi_Minh}") String zone,
                         @Value("${stayfinder.booking.checkout-time:12:00}") String checkoutTime) {
        if (holdMinutes < 1 || holdMinutes > 1440) throw new IllegalArgumentException("Booking hold must be 1..1440 minutes");
        this.clock=clock; this.holdDuration=Duration.ofMinutes(holdMinutes); this.zone=ZoneId.of(zone); this.checkoutTime=LocalTime.parse(checkoutTime);
    }
    public Instant now() { return clock.instant(); }
    public LocalDate today() { return LocalDate.now(clock.withZone(zone)); }
    public Instant legacyActiveSince() { return now().minus(holdDuration); }
    public Instant newExpiry() { return now().plus(holdDuration); }
    public Instant expiresAt(Booking booking) {
        return booking.getExpiresAt() != null ? booking.getExpiresAt()
                : booking.getCreatedAt() == null ? null : booking.getCreatedAt().plus(holdDuration);
    }
    public boolean expired(Booking booking) { return expiresAt(booking) != null && !expiresAt(booking).isAfter(now()); }
    public LocalDate completedThrough() {
        ZonedDateTime current = now().atZone(zone);
        return current.toLocalTime().isBefore(checkoutTime) ? current.toLocalDate().minusDays(1) : current.toLocalDate();
    }
}
