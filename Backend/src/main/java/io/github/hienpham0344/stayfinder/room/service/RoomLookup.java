package io.github.hienpham0344.stayfinder.room.service;

import java.util.Optional;
import java.util.UUID;

public interface RoomLookup {
    Optional<RoomBookingView> findBookingView(UUID roomId);
}
