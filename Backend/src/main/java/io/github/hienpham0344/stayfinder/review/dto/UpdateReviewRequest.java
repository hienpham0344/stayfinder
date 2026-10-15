package io.github.hienpham0344.stayfinder.review.dto;import jakarta.validation.constraints.*;import java.util.*;
public record UpdateReviewRequest(@NotNull @Min(1) @Max(5) Integer rating,@NotNull @Size(max=2000)String comment,@NotNull @Size(max=5)List<@NotNull UUID> mediaIds){}
