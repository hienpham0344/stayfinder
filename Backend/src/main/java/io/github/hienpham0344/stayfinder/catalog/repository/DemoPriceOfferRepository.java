package io.github.hienpham0344.stayfinder.catalog.repository;
import io.github.hienpham0344.stayfinder.catalog.dto.RawDemoOffer;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public class DemoPriceOfferRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public DemoPriceOfferRepository(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}
    public List<RawDemoOffer> find(UUID accommodation,UUID room) {
        return jdbc.query("""
            select accommodation_id,room_id,provider_name,nightly_price_cents,currency,includes_fees,
                   cleaning_fee_cents,service_fee_cents,cancellation_code,observed_at
            from demo_price_comparisons where accommodation_id=:accommodation and room_id=:room order by provider_name,id
            """,new MapSqlParameterSource().addValue("accommodation",accommodation).addValue("room",room),(row,index)->{
                var observed=row.getTimestamp("observed_at");
                return new RawDemoOffer(row.getObject("accommodation_id",UUID.class),row.getObject("room_id",UUID.class),
                    row.getString("provider_name"),row.getObject("nightly_price_cents",Long.class),row.getString("currency"),
                    row.getBoolean("includes_fees"),row.getObject("cleaning_fee_cents",Long.class),row.getObject("service_fee_cents",Long.class),
                    row.getString("cancellation_code"),observed==null?null:observed.toInstant());
            });
    }
}
