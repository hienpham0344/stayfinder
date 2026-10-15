package io.github.hienpham0344.stayfinder.payment.dto;
import jakarta.validation.constraints.*;
public record CreatePaymentRequest(@NotNull @Pattern(regexp="bank_transfer|pay_at_property") String method){}
