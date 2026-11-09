package io.github.hienpham0344.stayfinder.partner;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.review.entity.Review;
import io.github.hienpham0344.stayfinder.review.repository.ReviewRepository;
import io.github.hienpham0344.stayfinder.partner.repository.PartnerReviewRepository;
import io.github.hienpham0344.stayfinder.partner.service.PartnerReviewService;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
class PartnerReviewServiceTest {
    final AccommodationRepository stays=mock(AccommodationRepository.class);
    final ReviewRepository reviews=mock(ReviewRepository.class);
    final PartnerReviewRepository replies=mock(PartnerReviewRepository.class);
    final PartnerReviewService service=new PartnerReviewService(stays,reviews,replies,Clock.systemUTC());
    final UUID owner=UUID.randomUUID(),stay=UUID.randomUUID(),id=UUID.randomUUID();
    @Test void otherOwnerCannotListReviews() {
        assertThrows(BusinessException.class,()->service.list(owner,stay,0,20));
        verifyNoInteractions(replies);
    }
    @Test void anotherPropertyReviewCannotReceiveReply() {
        Review review=new Review();review.setAccommodationId(UUID.randomUUID());
        when(reviews.lockById(id)).thenReturn(Optional.of(review));
        assertThrows(BusinessException.class,()->service.reply(owner,stay,id,"Thanks"));
        verifyNoInteractions(replies);
    }
    @Test void replyKeepsGuestContentUnchanged() {
        Review review=new Review();review.setAccommodationId(stay);review.setRating(2);review.setComment("Original");
        when(reviews.lockById(id)).thenReturn(Optional.of(review));
        when(stays.lockOwned(stay,owner)).thenReturn(Optional.of(new Accommodation()));
        service.reply(owner,stay,id," Thanks ");
        verify(replies).saveReply(eq(id),eq(owner),eq("Thanks"),any());
        assertEquals(2,review.getRating());assertEquals("Original",review.getComment());
    }
    @Test void blankReplyCannotBeStored() {
        assertThrows(BusinessException.class,()->service.reply(owner,stay,id,"  "));
        verifyNoInteractions(reviews,replies);
    }
}
