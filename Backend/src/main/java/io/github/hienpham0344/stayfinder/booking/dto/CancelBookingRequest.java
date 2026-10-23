package io.github.hienpham0344.stayfinder.booking.dto;
import jakarta.validation.constraints.Size;
public record CancelBookingRequest(@Size(max=500) String reason){}
