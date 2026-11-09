package io.github.hienpham0344.stayfinder.partner.service;
import io.github.hienpham0344.stayfinder.partner.repository.PartnerReviewRepository;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
public class PublicPartnerReplyService {
    private final PartnerReviewRepository replies;
    public PublicPartnerReplyService(PartnerReviewRepository replies) { this.replies=replies; }
    public record ReplyResponse(UUID reviewId,String reply,Instant updatedAt) {}
    @Transactional(readOnly=true)
    public ReplyResponse read(UUID accommodationId,UUID reviewId) {
        var review=replies.publicReply(accommodationId,reviewId)
            .orElseThrow(()->new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        return new ReplyResponse(reviewId,review.reply(),review.repliedAt());
    }
}
