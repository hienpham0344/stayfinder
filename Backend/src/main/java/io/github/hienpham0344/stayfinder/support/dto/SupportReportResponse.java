package io.github.hienpham0344.stayfinder.support.dto;import java.time.Instant;import java.util.UUID;public record SupportReportResponse(UUID reportId,String status,Instant createdAt){}
