package io.github.hienpham0344.stayfinder.accommodation.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import java.math.BigDecimal;
import java.util.UUID;
public record StayCardResponse(UUID id,String name,UUID typeId,String typeName,String city,String address,
        BigDecimal latitude,BigDecimal longitude,MoneyUsd nightlyPrice,String coverImageUrl,
        Double ratingAverage,long reviewCount,boolean isFavorite) {}
