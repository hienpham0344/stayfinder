package io.github.hienpham0344.stayfinder.partner.service;

import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.review.repository.ReviewRepository;
import io.github.hienpham0344.stayfinder.partner.repository.PartnerReviewRepository;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerReviewResponse;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
@PreAuthorize("hasRole('PARTNER')")
public class PartnerReviewService {
    private final AccommodationRepository accommodations;
    private final ReviewRepository reviews;
    private final PartnerReviewRepository replies;
    private final Clock clock;
    public PartnerReviewService(AccommodationRepository accommodations, ReviewRepository reviews,
                               PartnerReviewRepository replies, Clock clock) {
        this.accommodations=accommodations;this.reviews=reviews;this.replies=replies;this.clock=clock;
    }
    @Transactional(readOnly=true)
    public List<PartnerReviewResponse> list(UUID partner, UUID accommodation, int page, int size) {
        if(page<0||size<1||size>100) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        if(!accommodations.existsByIdAndPartnerId(accommodation,partner)) throw new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND);
        return replies.list(accommodation,page,size);
    }
    @Transactional
    public void reply(UUID partner, UUID accommodation, UUID reviewId, String text) {
        if(text==null||text.isBlank()||text.length()>2000) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        // Partner can answer a guest but cannot change their rating or original comment.
        var review=reviews.lockById(reviewId).orElseThrow(()->new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        if(!accommodation.equals(review.getAccommodationId())) throw new BusinessException(ErrorCode.REVIEW_NOT_FOUND);
        accommodations.lockOwned(accommodation,partner).orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        replies.saveReply(reviewId,partner,text.strip(),clock.instant());
    }
}
