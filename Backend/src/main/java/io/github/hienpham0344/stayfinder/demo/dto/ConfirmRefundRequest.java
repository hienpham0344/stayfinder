package io.github.hienpham0344.stayfinder.demo.dto;
import jakarta.validation.constraints.*;
public record ConfirmRefundRequest(@NotBlank @Size(max=120) String reference){}
