package io.github.hienpham0344.stayfinder.partner.controller;
import io.github.hienpham0344.stayfinder.partner.service.PublicPartnerReplyService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
public class PublicPartnerReplyController {
    private final PublicPartnerReplyService service;
    public PublicPartnerReplyController(PublicPartnerReplyService service) { this.service=service; }
    @GetMapping("/api/accommodations/{accommodationId}/reviews/{reviewId}/partner-reply")
    public ApiResponse<PublicPartnerReplyService.ReplyResponse> read(@PathVariable UUID accommodationId,@PathVariable UUID reviewId) {
        return ApiResponse.success(service.read(accommodationId,reviewId));
    }
}
