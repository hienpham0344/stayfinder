package io.github.hienpham0344.stayfinder.catalog.service;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.exception.*;

public final class TripPriceCalculator {
    private TripPriceCalculator(){}
    public static MoneyUsd total(long nightlyCents,long nights,int quantity,long cleaningCents,long serviceCents) {
        if(nights<1||nights>90||quantity<1||quantity>10||nightlyCents<0||cleaningCents<0||serviceCents<0)
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        try {
            long subtotal=Math.multiplyExact(Math.multiplyExact(nightlyCents,nights),quantity);
            return MoneyUsd.cents(Math.addExact(Math.addExact(subtotal,cleaningCents),serviceCents));
        } catch(ArithmeticException|IllegalArgumentException exception) {throw new BusinessException(ErrorCode.VALIDATION_ERROR);}
    }
}
