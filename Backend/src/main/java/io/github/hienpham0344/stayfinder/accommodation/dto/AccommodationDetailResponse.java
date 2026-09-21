package io.github.hienpham0344.stayfinder.accommodation.dto;

import java.util.List;

public record AccommodationDetailResponse(AccommodationResponse accommodation,
                                          List<ImageResponse> images,
                                          List<FeatureResponse> features) {
}
