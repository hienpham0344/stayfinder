package io.github.hienpham0344.stayfinder.room.service;

import io.github.hienpham0344.stayfinder.room.dto.RoomResponse;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.room.mapper.RoomMapper;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.validation.SelectionPolicy;
import io.github.hienpham0344.stayfinder.snapshot.repository.SnapshotSourceQueryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
public class RoomServiceImpl implements RoomService,RoomLookup {
    private final RoomRepository rooms;
    private final AccommodationRepository accommodations;
    private final SnapshotSourceQueryRepository sources;
    private final RoomMapper mapper;
    private final Clock clock;
    public RoomServiceImpl(RoomRepository rooms,AccommodationRepository accommodations,SnapshotSourceQueryRepository sources,RoomMapper mapper,Clock clock) {
        this.rooms=rooms;this.accommodations=accommodations;this.sources=sources;this.mapper=mapper;this.clock=clock;
    }
    @Override @Transactional(readOnly=true)
    public List<RoomResponse> available(UUID id,LocalDate in,LocalDate out,int adults,int children,int quantity) {
        var accommodation=accommodations.findById(id).filter(a->a.getStatus()==AccommodationStatus.ACTIVE)
            .orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        ZoneId timezone;
        try {timezone=ZoneId.of(Objects.requireNonNull(accommodation.getTimezone()));}
        catch(DateTimeException|NullPointerException exception){throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
        SelectionPolicy.validateDatesAndGuests(in,out,quantity,adults,children,timezone,clock);
        var tiers=rooms.findByAccommodationIdAndStatus(id,RoomStatus.AVAILABLE).stream().filter(r->
                r.getStatus()==RoomStatus.AVAILABLE&&id.equals(r.getAccommodationId())
                &&r.getNightlyPriceCents()!=null&&r.getNightlyPriceCents()>=0&&r.getNightlyPriceCents()<=9_007_199_254_740_991L
                &&r.getStockTotal()!=null&&r.getStockTotal()>=quantity&&r.getMaxGuestsPerRoom()!=null
                &&RoomInventoryPolicy.fits(r.getMaxGuestsPerRoom(),quantity,adults,children)).toList();
        if(tiers.isEmpty())return List.of();
        var overlaps=sources.findOverlaps(id,tiers.stream().map(r->r.getId()).toList(),in,out,clock.instant());
        List<RoomResponse> result=new ArrayList<>();
        for(var tier:tiers) {
            int remaining=RoomInventoryPolicy.available(tier.getStockTotal(),overlaps,tier.getId(),id,in,out,clock.instant());
            if(remaining>=quantity)result.add(mapper.toResponse(tier,remaining,timezone.getId()));
        }
        result.sort(Comparator.comparingLong((RoomResponse r)->r.nightlyPrice().amountCents()).thenComparing(RoomResponse::id));
        return List.copyOf(result);
    }
    @Override @Transactional(readOnly=true)
    public Optional<RoomBookingView> findBookingView(UUID roomId) {
        // Legacy lookup is retained until the quote-based booking cutover; it does not authorize a write.
        return rooms.findById(roomId).map(r->new RoomBookingView(r.getId(),r.getAccommodationId(),r.getPrice(),r.getStatus()));
    }
}
