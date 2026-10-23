package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;import java.time.Instant;
public interface BookingPaymentOperations {
 // Caller holds owner wallet -> source room -> booking -> payment and has verified exact collection.
 boolean recordBankCollection(Booking booking,Instant collectedAt,Instant processedAt);
}
