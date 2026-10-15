package io.github.hienpham0344.stayfinder.room.service;
import io.github.hienpham0344.stayfinder.room.dto.RoomResponse;
import java.time.LocalDate;
import java.util.*;
public interface RoomService {
    List<RoomResponse> available(UUID accommodationId,LocalDate checkIn,LocalDate checkOut,int adults,int children,int quantity);
    default List<RoomResponse> listAvailable(UUID accommodationId,LocalDate checkIn,LocalDate checkOut,int guests) {
        return available(accommodationId,checkIn,checkOut,guests,0,1);
    }
}
