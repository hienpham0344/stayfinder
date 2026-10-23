package io.github.hienpham0344.stayfinder.common.dto;

public record MoneyUsd(long amountCents, String currency) {
    private static final long MAX_SAFE_INTEGER = 9_007_199_254_740_991L;
    public MoneyUsd {
        if (!"USD".equals(currency) || amountCents < 0 || amountCents > MAX_SAFE_INTEGER) {
            throw new IllegalArgumentException("Product money must be safe nonnegative USD cents");
        }
    }
    public static MoneyUsd cents(long amountCents) {
        return new MoneyUsd(amountCents, "USD");
    }
}
