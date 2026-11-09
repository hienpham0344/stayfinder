package io.github.hienpham0344.stayfinder.partner.dto;
import java.time.Instant;
import java.util.UUID;
public record PartnerReviewResponse(UUID id, Integer rating, String comment, Instant createdAt,
                                    String reply, Instant repliedAt) {}
