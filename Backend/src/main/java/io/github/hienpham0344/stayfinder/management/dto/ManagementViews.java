package io.github.hienpham0344.stayfinder.management.dto;

import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.partner.entity.PartnerApplication;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ManagementViews {
    private ManagementViews() { }

    public record Application(UUID id, UUID userId, String businessName, String description,
                               PartnerApplication.Status status, String reason, UUID reviewedBy,
                               Instant createdAt, Instant reviewedAt, long version) { }
    public record Account(UUID id, String fullName, String email, String phone, UserRole role,
                           boolean enabled, long version) { }
    public record Accommodation(UUID id, UUID partnerId, UUID typeId, String name, String address,
                                 String description, BigDecimal latitude, BigDecimal longitude,
                                 BigDecimal basePrice, AccommodationStatus status, Instant createdAt, long version) { }
    public record PropertyDetail(Accommodation accommodation, List<String> imageUrls, List<UUID> featureIds) { }
    public record Room(UUID id, UUID accommodationId, UUID roomTypeId, String name, String description,
                        BigDecimal price, Integer capacity, RoomStatus status, Instant createdAt, long version) { }
    public record Booking(UUID id, UUID userId, BigDecimal subtotal, BigDecimal discountAmount,
                            BigDecimal totalPrice, BookingStatus status, Instant createdAt,
                            Instant expiresAt, String cancellationReason) { }
    public record BookingLine(UUID id, UUID accommodationId, String accommodationName, UUID roomId,
                               String roomName, LocalDate checkIn, LocalDate checkOut, Integer quantity, Integer guests,
                               BigDecimal subtotal) { }
    public record BookingDetail(Booking booking, List<BookingLine> details) { }
    public record Payment(UUID id, UUID bookingId, BigDecimal amount, String transactionId,
                            PaymentStatus status, Instant createdAt) { }
    public record PaymentAnomaly(UUID id, UUID paymentId, UUID bookingId, String transactionId,
                                   String reason, BigDecimal amount, Instant createdAt) { }
    public record Review(UUID id, UUID userId, UUID bookingId, UUID accommodationId, Integer rating,
                           String comment, boolean hidden, Instant createdAt, long version) { }
    public record Statistics(long totalBookings, long pendingBookings, long cancelledBookings,
                               long completedBookings, BigDecimal receivedRevenue) { }
    public record Audit(UUID id, UUID actorId, String action, String targetType, UUID targetId,
                          String reason, Instant createdAt) { }
}
