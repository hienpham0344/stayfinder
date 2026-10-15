package io.github.hienpham0344.stayfinder.booking.dto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
public record CreateBookingRequest(@NotNull UUID quoteId,@NotNull @Valid GuestInformation guest,
 @NotNull @Pattern(regexp="bank_transfer|pay_at_property") String paymentMethod){}
