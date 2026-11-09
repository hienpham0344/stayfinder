package io.github.hienpham0344.stayfinder.partner.controller;

import io.github.hienpham0344.stayfinder.partner.dto.PartnerReviewResponse;
import io.github.hienpham0344.stayfinder.partner.service.PartnerReviewService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/partner/accommodations/{accommodationId}/reviews")
public class PartnerReviewController {
    private final PartnerReviewService service;
    public PartnerReviewController(PartnerReviewService service) { this.service=service; }
    public record ReplyRequest(@NotBlank @Size(max=2000) String reply) {}
    @GetMapping
    public ApiResponse<List<PartnerReviewResponse>> list(@PathVariable UUID accommodationId,
            @RequestParam(defaultValue="0") @Min(0) int page,
            @RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return ApiResponse.success(service.list(CurrentUser.require().id(),accommodationId,page,size));
    }
    @PutMapping("/{reviewId}/reply")
    public ApiResponse<Void> reply(@PathVariable UUID accommodationId,@PathVariable UUID reviewId,
                                   @Valid @RequestBody ReplyRequest request) {
        service.reply(CurrentUser.require().id(),accommodationId,reviewId,request.reply());
        return ApiResponse.success(null);
    }
}
