package io.github.hienpham0344.stayfinder.room.mapper;

import io.github.hienpham0344.stayfinder.room.dto.RoomResponse;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoomMapper {
    RoomResponse toResponse(Room entity);
}
