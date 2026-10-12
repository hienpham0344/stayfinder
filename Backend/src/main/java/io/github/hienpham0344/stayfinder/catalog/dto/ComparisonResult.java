package io.github.hienpham0344.stayfinder.catalog.dto;
import java.time.LocalDate;
import java.util.*;
public record ComparisonResult(UUID accommodationId,UUID roomId,LocalDate checkIn,LocalDate checkOut,
        int quantity,int adults,int children,List<PriceComparisonOffer> offers) {
    public ComparisonResult{offers=List.copyOf(offers);}
}
