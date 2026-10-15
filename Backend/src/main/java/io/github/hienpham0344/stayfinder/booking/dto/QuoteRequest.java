package io.github.hienpham0344.stayfinder.booking.dto;
import io.github.hienpham0344.stayfinder.common.dto.QuoteSelection;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;
public record QuoteRequest(@NotNull UUID accommodationId,@NotNull UUID roomId,@NotNull LocalDate checkIn,@NotNull LocalDate checkOut,
 @Min(1) @Max(10) int quantity,@Min(1) @Max(20) int adults,@Min(0) @Max(20) int children,UUID voucherId,@Min(0) @Max(9_007_199_254_740_991L) Long rewardPoints) {
 public QuoteSelection selection(){return new QuoteSelection(accommodationId,roomId,checkIn,checkOut,quantity,adults,children);}
 public long requestedPoints(){return rewardPoints==null?0:rewardPoints;}
}
