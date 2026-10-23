package io.github.hienpham0344.stayfinder.room.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import java.math.BigDecimal;
import java.util.*;
public record RoomResponse(UUID id,UUID accommodationId,String name,String description,MoneyUsd nightlyPrice,
        BigDecimal sizeSqm,String bedType,int maxGuestsPerRoom,int stockTotal,int availableCount,
        Boolean includesBreakfast,List<String> imageUrls,CancellationPolicyResponse cancellationPolicy) {
    public RoomResponse {imageUrls=imageUrls==null?List.of():List.copyOf(imageUrls);}
}
