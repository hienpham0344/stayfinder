package io.github.hienpham0344.stayfinder.snapshot.repository;

import io.github.hienpham0344.stayfinder.snapshot.dto.SnapshotSourceView;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;
import java.sql.*;
import java.time.*;
import java.util.*;

// These source/hold columns are proposed rollout mappings; validate them against reviewed metadata before deployment.
@Repository
public class SnapshotSourceQueryRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public SnapshotSourceQueryRepository(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}

    public List<SnapshotSourceView> findOverlaps(UUID accommodationId,Collection<UUID> roomIds,LocalDate checkIn,LocalDate checkOut,Instant now) {
        if(roomIds.isEmpty())return List.of();
        String sql="""
            select d.booking_id,d.room_snapshot_id,d.accommodation_snapshot_id,
                   rs.source_room_id,acs.source_accommodation_id,d.check_in_date,d.check_out_date,d.quantity,b.status,b.hold_expires_at
            from booking_details d join bookings b on b.id=d.booking_id
            left join room_snapshot rs on rs.id=d.room_snapshot_id
            left join accommodation_snapshot acs on acs.id=d.accommodation_snapshot_id
            where (b.status='confirmed' or (b.status='pending' and (b.hold_expires_at is null or b.hold_expires_at>:now)))
            and (rs.source_room_id in (:roomIds) or (rs.source_room_id is null and (acs.source_accommodation_id=:accommodationId or acs.source_accommodation_id is null)))
            and (d.check_in_date is null or d.check_out_date is null or d.check_in_date>=d.check_out_date
                 or (d.check_in_date<:checkOut and d.check_out_date>:checkIn))
            """;
        MapSqlParameterSource parameters=new MapSqlParameterSource().addValue("accommodationId",accommodationId)
            .addValue("roomIds",roomIds).addValue("checkIn",checkIn).addValue("checkOut",checkOut)
            .addValue("now",OffsetDateTime.ofInstant(now,ZoneOffset.UTC));
        return jdbc.query(sql,parameters,(row,index)->new SnapshotSourceView(
            row.getObject("booking_id",UUID.class),row.getObject("room_snapshot_id",UUID.class),row.getObject("accommodation_snapshot_id",UUID.class),
            row.getObject("source_room_id",UUID.class),row.getObject("source_accommodation_id",UUID.class),
            date(row,"check_in_date"),date(row,"check_out_date"),row.getObject("quantity",Integer.class),new io.github.hienpham0344.stayfinder.common.enums.BookingStatusConverter().convertToEntityAttribute(row.getString("status")),
            instant(row,"hold_expires_at")));
    }
    private static LocalDate date(ResultSet row,String name) throws SQLException {
        java.sql.Date value=row.getDate(name);return value==null?null:value.toLocalDate();
    }
    private static Instant instant(ResultSet row,String name) throws SQLException {
        Timestamp value=row.getTimestamp(name);return value==null?null:value.toInstant();
    }

    // Fixed aliases r/a are used by the catalog read repository; all request values remain bound parameters.
    public static String sufficientStockOnEveryNightSql() {
        return """
            not exists (
              select 1 from generate_series(cast(:checkIn as date),cast(:checkOut as date)-1,interval '1 day') requested(night)
              where r.stock_total - (
                select coalesce(sum(case
                  when rs.source_room_id is null or d.quantity is null or d.quantity<1
                    or d.check_in_date is null or d.check_out_date is null or d.check_in_date>=d.check_out_date
                    or (acs.source_accommodation_id is not null and acs.source_accommodation_id<>a.id)
                  then r.stock_total else d.quantity end),0)
                from booking_details d join bookings b on b.id=d.booking_id
                left join room_snapshot rs on rs.id=d.room_snapshot_id
                left join accommodation_snapshot acs on acs.id=d.accommodation_snapshot_id
                where (b.status='confirmed' or (b.status='pending' and (b.hold_expires_at is null or b.hold_expires_at>:now)))
                  and (rs.source_room_id=r.id or (rs.source_room_id is null and (acs.source_accommodation_id=a.id or acs.source_accommodation_id is null)))
                  and (d.check_in_date is null or d.check_out_date is null or d.check_in_date>=d.check_out_date
                    or (d.check_in_date<=requested.night and d.check_out_date>requested.night))
              ) < :rooms
            )
            """;
    }
}
