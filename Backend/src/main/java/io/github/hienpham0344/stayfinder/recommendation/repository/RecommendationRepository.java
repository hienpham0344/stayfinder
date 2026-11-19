package io.github.hienpham0344.stayfinder.recommendation.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.*;

@Repository
public class RecommendationRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public RecommendationRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }
    public List<Preference> preferences(UUID userId) {
        if (userId == null) return List.of();
        return jdbc.query("select a.id,a.type_id,a.base_price from accommodations a where a.id in ("
                + "select f.accommodation_id from favorites f where f.user_id=:userId union "
                + "select s.accommodation_id from bookings b join booking_details d on d.booking_id=b.id "
                + "join accommodation_snapshot s on s.id=d.accommodation_snapshot_id where b.user_id=:userId and b.status='completed') "
                + "order by a.id limit 50", Map.of("userId", userId), (rs, i) -> new Preference(
                rs.getObject("id", UUID.class), rs.getObject("type_id", UUID.class), rs.getBigDecimal("base_price")));
    }
    public Map<UUID, Set<UUID>> features(Collection<UUID> ids) {
        Map<UUID, Set<UUID>> result = new HashMap<>();
        if (ids.isEmpty()) return result;
        jdbc.query("select accommodation_id,features_id from accommodation_features where accommodation_id in (:ids)",
                new MapSqlParameterSource("ids", ids), rs -> {
                    result.computeIfAbsent(rs.getObject("accommodation_id", UUID.class), key -> new HashSet<>())
                            .add(rs.getObject("features_id", UUID.class));
                });
        return result;
    }
    public Map<UUID, Rating> ratings(Collection<UUID> ids) {
        Map<UUID, Rating> result = new HashMap<>();
        if (ids.isEmpty()) return result;
        jdbc.query("select accommodation_id,avg(rating) as average,count(*) as total from reviews "
                + "where hidden=false and accommodation_id in (:ids) group by accommodation_id",
                new MapSqlParameterSource("ids", ids), rs -> {
                    result.put(rs.getObject("accommodation_id", UUID.class), new Rating(rs.getDouble("average"), rs.getLong("total")));
                });
        return result;
    }
    public record Preference(UUID id, UUID typeId, BigDecimal price) { }
    public record Rating(double average, long count) { }
}
