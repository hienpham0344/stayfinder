package io.github.hienpham0344.stayfinder.room.service;

import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.snapshot.dto.SnapshotSourceView;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

public final class RoomInventoryPolicy {
    private RoomInventoryPolicy(){}
    public static int available(int stock,List<SnapshotSourceView> rows,UUID room,UUID accommodation,
            LocalDate checkIn,LocalDate checkOut,Instant now) {
        if(stock<0||checkIn==null||checkOut==null||!checkIn.isBefore(checkOut)
                ||ChronoUnit.DAYS.between(checkIn,checkOut)>90)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        List<SnapshotSourceView> blocking=new ArrayList<>();
        for(var row:rows) {
            boolean active=row.status()==BookingStatus.CONFIRMED
                ||(row.status()==BookingStatus.PENDING&&(row.holdExpiresAt()==null||now.isBefore(row.holdExpiresAt())));
            if(!active)continue;
            boolean relevant=row.sourceRoomId()!=null?room.equals(row.sourceRoomId())
                :row.sourceAccommodationId()==null||accommodation.equals(row.sourceAccommodationId());
            if(!relevant)continue;
            if(row.checkIn()==null||row.checkOut()==null||!row.checkIn().isBefore(row.checkOut()))return 0;
            if(!row.checkIn().isBefore(checkOut)||!row.checkOut().isAfter(checkIn))continue;
            if(row.sourceRoomId()==null||row.quantity()==null||row.quantity()<1
                ||(row.sourceAccommodationId()!=null&&!accommodation.equals(row.sourceAccommodationId())))return 0;
            blocking.add(row);
        }
        long peak=0;
        for(LocalDate day=checkIn;day.isBefore(checkOut);day=day.plusDays(1)) {
            long used=0;
            for(var row:blocking)if(!day.isBefore(row.checkIn())&&day.isBefore(row.checkOut()))used+=row.quantity();
            peak=Math.max(peak,used);
            if(peak>=stock)return 0;
        }
        return stock-(int)peak;
    }
    public static boolean fits(int capacity,int quantity,int adults,int children) {
        return capacity>=1&&quantity>=1&&quantity<=10&&adults>=1&&adults<=20&&children>=0&&children<=20
                &&(long)adults+children<=(long)capacity*quantity;
    }
}
