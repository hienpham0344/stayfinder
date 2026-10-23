package io.github.hienpham0344.stayfinder.payment.dto;
public record PaymentMethodOption(String method,boolean enabled,String provider,String environment,String productCurrency,String settlementCurrency,String disabledReason){}
