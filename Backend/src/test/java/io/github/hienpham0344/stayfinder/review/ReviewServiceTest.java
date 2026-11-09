package io.github.hienpham0344.stayfinder.review;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.booking.service.BookingEligibility;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.review.dto.UpdateReviewRequest;
import io.github.hienpham0344.stayfinder.review.entity.Review;
import io.github.hienpham0344.stayfinder.review.mapper.ReviewMapper;
import io.github.hienpham0344.stayfinder.review.repository.ReviewRepository;
import io.github.hienpham0344.stayfinder.review.service.ReviewServiceImpl;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ReviewServiceTest {
    private final ReviewRepository repository = mock(ReviewRepository.class);
    private final ReviewServiceImpl service = new ReviewServiceImpl(repository, mock(BookingEligibility.class),
            mock(AccommodationLookup.class), Mappers.getMapper(ReviewMapper.class));

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void patchingOnlyCommentPreservesTheExistingRating() {
        UUID userId = UUID.randomUUID();
        UUID reviewId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(userId, "user@example.com", UserRole.CUSTOMER), null, List.of()));
        Review review = new Review();
        review.setId(reviewId);
        review.setUserId(userId);
        review.setRating(5);
        review.setComment("old");
        when(repository.findById(reviewId)).thenReturn(Optional.of(review));
        when(repository.save(any(Review.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.update(reviewId, new UpdateReviewRequest(null, "new"));

        assertEquals(5, review.getRating());
        assertEquals("new", review.getComment());
    }
}
