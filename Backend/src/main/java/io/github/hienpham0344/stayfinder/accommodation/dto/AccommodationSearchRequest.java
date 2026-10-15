package io.github.hienpham0344.stayfinder.accommodation.dto;

import io.github.hienpham0344.stayfinder.common.exception.*;
import lombok.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import java.util.*;
@Getter @Setter @NoArgsConstructor
public class AccommodationSearchRequest {
    private static final long MAX_CENTS=9_007_199_254_740_991L;
    private String q;
    private UUID locationId;
    private LocalDate checkIn,checkOut;
    private Integer adults=1,children=0,rooms=1;
    private Long minPriceCents,maxPriceCents;
    private BigDecimal minRating;
    private List<UUID> typeIds=List.of(),amenityIds=List.of();
    private String sort="recommended",direction="asc",section="all";

    public void validateAndNormalize() {
        q=q==null?"":q.trim();
        if(q.length()>120||(checkIn==null)!=(checkOut==null))invalid();
        if(checkIn!=null&&(!checkIn.isBefore(checkOut)||ChronoUnit.DAYS.between(checkIn,checkOut)>90))invalid();
        adults=adults==null?1:adults;children=children==null?0:children;rooms=rooms==null?1:rooms;
        if(adults<1||adults>20||children<0||children>20||rooms<1||rooms>10)invalid();
        if(invalidPrice(minPriceCents)||invalidPrice(maxPriceCents)
                ||minPriceCents!=null&&maxPriceCents!=null&&minPriceCents>maxPriceCents)invalid();
        if(minRating!=null&&(minRating.compareTo(BigDecimal.ONE)<0||minRating.compareTo(new BigDecimal("5"))>0))invalid();
        typeIds=selectors(typeIds);amenityIds=selectors(amenityIds);
        sort=sort==null?"recommended":sort;
        if("basePrice".equals(sort))sort="price";
        direction=direction==null?"asc":direction.toLowerCase(Locale.ROOT);
        section=section==null?"all":section;
        if(!Set.of("name","price","rating","recommended").contains(sort)
                ||!Set.of("asc","desc").contains(direction)||!Set.of("all","popular","recommended").contains(section))invalid();
    }
    private static boolean invalidPrice(Long price){return price!=null&&(price<0||price>MAX_CENTS);}
    private static List<UUID> selectors(List<UUID> ids) {
        if(ids==null)return List.of();
        if(ids.size()>20||ids.stream().anyMatch(Objects::isNull))invalid();
        return List.copyOf(new LinkedHashSet<>(ids));
    }
    private static void invalid(){throw new BusinessException(ErrorCode.VALIDATION_ERROR);}
}
