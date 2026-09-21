package io.github.hienpham0344.stayfinder.review.mapper;

import io.github.hienpham0344.stayfinder.review.dto.ReviewResponse;
import io.github.hienpham0344.stayfinder.review.entity.Review;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    ReviewResponse toResponse(Review entity);
}
