package io.github.hienpham0344.stayfinder.accommodation.mapper;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.FeatureResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.ImageResponse;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.entity.Feature;
import io.github.hienpham0344.stayfinder.accommodation.entity.Image;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccommodationMapper {
    @Mapping(target = "matchedRoomId", ignore = true)
    @Mapping(target = "matchedPrice", ignore = true)
    AccommodationResponse toResponse(Accommodation entity);
    ImageResponse toImageResponse(Image entity);
    FeatureResponse toFeatureResponse(Feature entity);
}
