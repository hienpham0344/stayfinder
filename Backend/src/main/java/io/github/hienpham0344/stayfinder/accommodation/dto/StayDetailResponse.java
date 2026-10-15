package io.github.hienpham0344.stayfinder.accommodation.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import java.math.BigDecimal;
import java.util.*;
public record StayDetailResponse(UUID id,String name,UUID typeId,String typeName,String city,String address,
        BigDecimal latitude,BigDecimal longitude,MoneyUsd nightlyPrice,String coverImageUrl,
        Double ratingAverage,long reviewCount,boolean isFavorite,String description,String timezone,
        List<String> imageUrls,List<AmenityDto> amenities,MoneyUsd cleaningFee,MoneyUsd serviceFee,
        Integer bedrooms,Integer beds,Integer baths,HostResponse host) {
    public StayDetailResponse {imageUrls=List.copyOf(imageUrls);amenities=List.copyOf(amenities);}
}
