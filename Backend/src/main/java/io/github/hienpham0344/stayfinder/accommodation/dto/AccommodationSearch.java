package io.github.hienpham0344.stayfinder.accommodation.dto;

import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AccommodationSearch(String q, UUID typeId, List<UUID> featureIds, BigDecimal minPrice,
                                  BigDecimal maxPrice, LocalDate checkIn, LocalDate checkOut, int guests) {
    public void validate(Clock clock) {
        if ((q != null && q.length() > 200) || guests < 1 || guests > 100
                || (featureIds != null && featureIds.size() > 20)
                || (minPrice != null && minPrice.signum() < 0)
                || (maxPrice != null && maxPrice.signum() < 0)
                || (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0)
                || (checkIn == null) != (checkOut == null)
                || (checkIn != null && (checkIn.isBefore(LocalDate.now(clock.withZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")))) || !checkIn.isBefore(checkOut)
                    || checkOut.isAfter(checkIn.plusDays(365))))) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }
}
