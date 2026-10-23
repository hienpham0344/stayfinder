package io.github.hienpham0344.stayfinder.room.mapper;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.room.dto.*;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import org.mapstruct.*;
@Mapper(componentModel="spring")
public interface RoomMapper {
    @Mapping(target="nightlyPrice",source="entity.nightlyPriceCents")
    @Mapping(target="cancellationPolicy",source="timezone")
    RoomResponse toResponse(Room entity,int availableCount,String timezone);
    default MoneyUsd money(Long cents){return cents==null?null:MoneyUsd.cents(cents);}
    default CancellationPolicyResponse policy(String timezone){return new CancellationPolicyResponse(true,"14:00",timezone);}
}
