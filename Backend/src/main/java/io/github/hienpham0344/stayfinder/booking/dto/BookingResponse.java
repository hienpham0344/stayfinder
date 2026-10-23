package io.github.hienpham0344.stayfinder.booking.dto;
import java.time.*;
import java.util.UUID;
public record BookingResponse(UUID id,String confirmationCode,String status,String cancellationReason,
 Instant createdAt,Instant holdExpiresAt,String paymentMethod,UUID accommodationId,UUID roomId,
 String stayName,String roomName,String imageUrl,LocalDate checkIn,LocalDate checkOut,String timezone,
 int quantity,int adults,int children,QuoteResponse quote,GuestInformation guest,String paymentStatus,
 String refundStatus,AllowedActions allowedActions) {
 public record AllowedActions(boolean cancel,boolean review,boolean rebook){}
}
