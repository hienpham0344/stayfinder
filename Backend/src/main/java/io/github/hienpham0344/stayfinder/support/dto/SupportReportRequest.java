package io.github.hienpham0344.stayfinder.support.dto;import jakarta.validation.constraints.*;import java.util.UUID;
public record SupportReportRequest(@NotNull @Pattern(regexp="Booking|Payment|Account|Rewards|Other")String category,@NotBlank @Size(max=5000)String description,UUID bookingId){}
