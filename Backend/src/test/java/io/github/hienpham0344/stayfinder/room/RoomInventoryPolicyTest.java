package io.github.hienpham0344.stayfinder.room;

import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.room.service.RoomInventoryPolicy;
import io.github.hienpham0344.stayfinder.snapshot.dto.SnapshotSourceView;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class RoomInventoryPolicyTest {
    private final UUID room=UUID.randomUUID(),accommodation=UUID.randomUUID();
    private final LocalDate start=LocalDate.of(2026,11,1),end=start.plusDays(3);
    private final Instant now=Instant.parse("2026-10-13T00:00:00Z");
    private SnapshotSourceView reservation(LocalDate in,LocalDate out,Integer quantity,BookingStatus status,Instant hold) {
        return new SnapshotSourceView(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),room,accommodation,in,out,quantity,status,hold);
    }
    @Test void countsQuantityBySourceIdentityRatherThanSnapshotPrimaryKey() {
        var row=reservation(start,end,2,BookingStatus.CONFIRMED,null);
        assertNotEquals(room,row.roomSnapshotId());
        assertEquals(1,RoomInventoryPolicy.available(3,List.of(row),room,accommodation,start,end,now));
    }
    @Test void usesPeakNightlyOccupancyForAdjacentReservations() {
        var first=reservation(start,start.plusDays(1),2,BookingStatus.CONFIRMED,null);
        var next=reservation(start.plusDays(1),end,1,BookingStatus.CONFIRMED,null);
        assertEquals(1,RoomInventoryPolicy.available(3,List.of(first,next),room,accommodation,start,end,now));
    }
    @Test void ignoresExpiredHoldsCancelledBookingsAndHalfOpenBoundary() {
        var expired=reservation(start,end,3,BookingStatus.PENDING,now);
        var cancelled=reservation(start,end,3,BookingStatus.CANCELLED,null);
        var boundary=reservation(start.minusDays(2),start,3,BookingStatus.CONFIRMED,null);
        assertEquals(3,RoomInventoryPolicy.available(3,List.of(expired,cancelled,boundary),room,accommodation,start,end,now));
        var live=reservation(start,end,2,BookingStatus.PENDING,now.plusSeconds(1));
        assertEquals(1,RoomInventoryPolicy.available(3,List.of(live),room,accommodation,start,end,now));
    }
    @Test void conservativelyBlocksLegacyReservationsWithoutMappedSourceOrQuantity() {
        var unknown=new SnapshotSourceView(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),null,accommodation,start,end,1,BookingStatus.CONFIRMED,null);
        assertEquals(0,RoomInventoryPolicy.available(3,List.of(unknown),room,accommodation,start,end,now));
        assertEquals(0,RoomInventoryPolicy.available(3,List.of(reservation(start,end,null,BookingStatus.CONFIRMED,null)),room,accommodation,start,end,now));
    }
    @Test void honorsCapacityTimesQuantityAndCountsChildren() {
        assertFalse(RoomInventoryPolicy.fits(2,1,3,0));
        assertFalse(RoomInventoryPolicy.fits(2,1,1,2));
        assertTrue(RoomInventoryPolicy.fits(2,2,3,1));
    }
}
