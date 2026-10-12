package io.github.hienpham0344.stayfinder.catalog.service;

import io.github.hienpham0344.stayfinder.catalog.dto.*;
import io.github.hienpham0344.stayfinder.catalog.repository.DemoPriceOfferRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomService;
import io.github.hienpham0344.stayfinder.common.dto.*;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.validation.SelectionPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class PriceComparisonService {
    private final AccommodationRepository accommodations;
    private final RoomService rooms;
    private final DemoPriceOfferRepository offers;
    private final Clock clock;
    public PriceComparisonService(AccommodationRepository accommodations,RoomService rooms,DemoPriceOfferRepository offers,Clock clock) {
        this.accommodations=accommodations;this.rooms=rooms;this.offers=offers;this.clock=clock;
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public ComparisonResult compare(UUID id,QuoteSelection selection) {
        if(selection==null||!id.equals(selection.accommodationId()))throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        var accommodation=accommodations.findById(id).filter(a->a.getStatus()==AccommodationStatus.ACTIVE)
            .orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        ZoneId zone;
        try {zone=ZoneId.of(Objects.requireNonNull(accommodation.getTimezone()));}
        catch(DateTimeException|NullPointerException exception){throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
        SelectionPolicy.validate(selection,zone,clock);
        if(accommodation.getCleaningFeeCents()==null||accommodation.getServiceFeeCents()==null)
            throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        var tier=rooms.available(id,selection.checkIn(),selection.checkOut(),selection.adults(),selection.children(),selection.quantity()).stream()
            .filter(r->selection.roomId().equals(r.id())&&id.equals(r.accommodationId())).findFirst()
            .orElseThrow(()->new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE));
        long nights=ChronoUnit.DAYS.between(selection.checkIn(),selection.checkOut());
        String freeDescription=selection.checkIn().atTime(14,0).atZone(zone).toInstant().isAfter(clock.instant())
            ?"Free cancellation before check-in":"Cancellation deadline has passed";
        List<Candidate> candidates=new ArrayList<>();
        candidates.add(new Candidate(new PriceComparisonOffer("StayFinder",
            TripPriceCalculator.total(tier.nightlyPrice().amountCents(),nights,selection.quantity(),accommodation.getCleaningFeeCents(),accommodation.getServiceFeeCents()),
            tier.nightlyPrice(),true,freeDescription,clock.instant(),true,false),true));
        for(var raw:offers.find(id,selection.roomId())) {
            if(!id.equals(raw.accommodationId())||!selection.roomId().equals(raw.roomId())||!"USD".equals(raw.currency())
                    ||raw.providerName()==null||raw.providerName().isBlank()||raw.observedAt()==null||raw.nightlyPriceCents()==null)continue;
            if(raw.includesFees()&&(raw.cleaningFeeCents()==null||raw.serviceFeeCents()==null))continue;
            boolean free="free_before_checkin".equals(raw.cancellationCode());
            String cancellation=free?freeDescription:"non_refundable".equals(raw.cancellationCode())?"Non-refundable":"Cancellation terms unavailable";
            try {
                MoneyUsd total=TripPriceCalculator.total(raw.nightlyPriceCents(),nights,selection.quantity(),
                    raw.includesFees()?raw.cleaningFeeCents():0L,raw.includesFees()?raw.serviceFeeCents():0L);
                var offer=new PriceComparisonOffer(raw.providerName(),total,MoneyUsd.cents(raw.nightlyPriceCents()),raw.includesFees(),
                    cancellation,raw.observedAt(),true,false);
                candidates.add(new Candidate(offer,raw.includesFees()&&free));
            } catch(BusinessException|IllegalArgumentException exception) {
                // Invalid seed money is not presented as a comparable USD offer.
            }
        }
        long minimum=candidates.stream().filter(Candidate::comparable).mapToLong(c->c.offer().total().amountCents()).min().orElseThrow();
        List<PriceComparisonOffer> result=candidates.stream().map(c->{
            var o=c.offer();
            return new PriceComparisonOffer(o.providerName(),o.total(),o.nightlyPrice(),o.includesFees(),o.cancellationDescription(),
                o.observedAt(),true,c.comparable()&&o.total().amountCents()==minimum);
        }).sorted(Comparator.comparingLong((PriceComparisonOffer o)->o.total().amountCents()).thenComparing(PriceComparisonOffer::providerName)).toList();
        return new ComparisonResult(id,selection.roomId(),selection.checkIn(),selection.checkOut(),selection.quantity(),selection.adults(),selection.children(),result);
    }
    private record Candidate(PriceComparisonOffer offer,boolean comparable) {}
}
