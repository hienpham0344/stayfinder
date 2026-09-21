package io.github.hienpham0344.stayfinder.accommodation.mapper;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.FeatureResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.ImageResponse;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.entity.Feature;
import io.github.hienpham0344.stayfinder.accommodation.entity.Image;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AccommodationMapper {
    AccommodationResponse toResponse(Accommodation entity);
    ImageResponse toImageResponse(Image entity);
    FeatureResponse toFeatureResponse(Feature entity);
}
