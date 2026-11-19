package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationSearch;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public class AccommodationSearchRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public AccommodationSearchRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Page<AccommodationResponse> search(AccommodationSearch request, Pageable page, Instant now) {
        MapSqlParameterSource params = new MapSqlParameterSource("guests", request.guests())
                .addValue("now", Timestamp.from(now));
        StringBuilder room = new StringBuilder("r.accommodation_id=a.id and r.status='available' and r.capacity>=:guests and r.price>0");
        if (request.minPrice() != null) { room.append(" and r.price>=:minPrice"); params.addValue("minPrice", request.minPrice()); }
        if (request.maxPrice() != null) { room.append(" and r.price<=:maxPrice"); params.addValue("maxPrice", request.maxPrice()); }
        if (request.checkIn() != null) {
            room.append(" and not exists (select 1 from booking_details d join room_snapshot s on s.id=d.room_snapshot_id "
                    + "join bookings b on b.id=d.booking_id where s.room_id=r.id and d.check_in_date<:checkOut "
                    + "and d.check_out_date>:checkIn and (b.status='confirmed' or (b.status='pending' and b.expires_at>:now)))");
            params.addValue("checkIn", request.checkIn()).addValue("checkOut", request.checkOut());
        }
        StringBuilder from = new StringBuilder(" from accommodations a join lateral (select r.id,r.price from room r where ")
                .append(room).append(" order by r.price,r.id limit 1) matched on true where a.status='active'");
        if (request.q() != null && !request.q().isBlank()) {
            from.append(" and (a.name ilike :q escape '!' or a.address ilike :q escape '!')");
            params.addValue("q", "%" + request.q().trim().replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%");
        }
        if (request.typeId() != null) { from.append(" and a.type_id=:typeId"); params.addValue("typeId", request.typeId()); }
        if (request.featureIds() != null && !request.featureIds().isEmpty()) {
            List<UUID> features = request.featureIds().stream().distinct().toList();
            from.append(" and (select count(distinct f.features_id) from accommodation_features f where f.accommodation_id=a.id and f.features_id in (:features))=:featureCount");
            params.addValue("features", features).addValue("featureCount", features.size());
        }
        String sort = page.getSort().stream().findFirst().map(order -> {
            String column = switch (order.getProperty()) {
                case "name" -> "a.name";
                case "basePrice" -> "matched.price";
                default -> "a.created_at";
            };
            return column + (order.isAscending() ? " asc" : " desc");
        }).orElse("a.created_at desc");
        Long total = jdbc.queryForObject("select count(*)" + from, params, Long.class);
        params.addValue("limit", page.getPageSize()).addValue("offset", page.getOffset());
        List<AccommodationResponse> rows = jdbc.query("select a.*,matched.id as matched_room_id,matched.price as matched_price"
                + from + " order by " + sort + ",a.id desc limit :limit offset :offset", params, ROW_MAPPER);
        return new PageImpl<>(rows, page, total == null ? 0 : total);
    }

    public static final RowMapper<AccommodationResponse> ROW_MAPPER = (rs, index) -> new AccommodationResponse(
            rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("address"),
            rs.getBigDecimal("latitude"), rs.getBigDecimal("longitude"), rs.getString("description"),
            rs.getBigDecimal("matched_price"), AccommodationStatus.ACTIVE, rs.getObject("type_id", UUID.class),
            rs.getObject("matched_room_id", UUID.class), rs.getBigDecimal("matched_price"));
}
