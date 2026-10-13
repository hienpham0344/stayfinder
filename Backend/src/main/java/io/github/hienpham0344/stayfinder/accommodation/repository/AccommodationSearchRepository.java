package io.github.hienpham0344.stayfinder.accommodation.repository;

import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.snapshot.repository.SnapshotSourceQueryRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;
import java.sql.*;
import java.time.*;
import java.util.*;

@Repository
public class AccommodationSearchRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public AccommodationSearchRepository(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}
    private static final String COLUMNS="""
        select a.id,a.name,a.type_id,t.name as type_name,l.city,a.address,a.latitude,a.longitude,
               pricing.nightly_price_cents,
               (select i.url from images i where i.accommodation_id=a.id order by i.id limit 1) as cover_image_url,
               ratings.rating_average,ratings.review_count,
               exists(select 1 from favorites f where f.accommodation_id=a.id and f.user_id=cast(:viewerId as uuid)) as is_favorite
        """;
    public PageResponse<StayCardResponse> search(AccommodationSearchRequest request,Pageable page,UUID viewer,Instant now) {
        request.validateAndNormalize();
        if(page.getPageNumber()<0||page.getPageSize()<1||page.getPageSize()>100)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        MapSqlParameterSource parameters=parameters(request,viewer,now);
        String from=from(request);
        Long count=jdbc.queryForObject("select count(*) "+from,parameters,Long.class);
        long total=count==null?0:count;
        if(total==0)return new PageResponse<>(List.of(),page.getPageNumber(),page.getPageSize(),0,0);
        String order=switch(request.getSort()) {
            case "name"->"a.name";
            case "price"->"pricing.nightly_price_cents";
            case "rating"->"ratings.rating_average";
            default->"a.curated_recommended_rank";
        };
        parameters.addValue("limit",page.getPageSize()).addValue("offset",page.getOffset());
        List<StayCardResponse> items=jdbc.query(COLUMNS+from+" order by "+order+" "+request.getDirection()
                +" nulls last,a.id asc limit :limit offset :offset",parameters,AccommodationSearchRepository::card);
        int pages=Math.toIntExact((total-1)/page.getPageSize()+1);
        return new PageResponse<>(items,page.getPageNumber(),page.getPageSize(),total,pages);
    }
    public PageResponse<io.github.hienpham0344.stayfinder.favorite.dto.FavoriteCardResponse> favorites(Pageable page,UUID viewer,Instant now) {
        if(viewer==null)throw new BusinessException(ErrorCode.UNAUTHORIZED);
        if(page.getPageNumber()<0||page.getPageSize()<1||page.getPageSize()>100)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        AccommodationSearchRequest request=new AccommodationSearchRequest();request.validateAndNormalize();
        var parameters=parameters(request,viewer,now).addValue("limit",page.getPageSize()).addValue("offset",page.getOffset());
        String from=from(request)+" and exists(select 1 from favorites saved where saved.accommodation_id=a.id and saved.user_id=cast(:viewerId as uuid)) ";
        Long count=jdbc.queryForObject("select count(*) "+from,parameters,Long.class);long total=count==null?0:count;
        String columns=COLUMNS.replace("select a.id,", "select (select saved.id from favorites saved where saved.accommodation_id=a.id and saved.user_id=cast(:viewerId as uuid) order by saved.id limit 1) as favorite_id,a.id,");
        var items=jdbc.query(columns+from+" order by a.name,a.id limit :limit offset :offset",parameters,(row,index)->
            new io.github.hienpham0344.stayfinder.favorite.dto.FavoriteCardResponse(row.getObject("favorite_id",UUID.class),card(row,index)));
        return new PageResponse<>(items,page.getPageNumber(),page.getPageSize(),total,total==0?0:Math.toIntExact((total-1)/page.getPageSize()+1));
    }
    public Optional<StayCardResponse> findCard(UUID id,UUID viewer,Instant now) {
        AccommodationSearchRequest request=new AccommodationSearchRequest();request.validateAndNormalize();
        var parameters=parameters(request,viewer,now).addValue("selectedId",id);
        return jdbc.query(COLUMNS+from(request)+" and a.id=:selectedId",parameters,AccommodationSearchRepository::card).stream().findFirst();
    }
    private static String from(AccommodationSearchRequest request) {
        StringBuilder room=new StringBuilder("""
            r.accommodation_id=a.id and r.status='available'
            and r.nightly_price_cents between 0 and 9007199254740991
            and r.stock_total>=:rooms and cast(r.max_guests_per_room as bigint)*:rooms>=:guestCount
            """);
        if(request.getMinPriceCents()!=null)room.append(" and r.nightly_price_cents>=:minPrice ");
        if(request.getMaxPriceCents()!=null)room.append(" and r.nightly_price_cents<=:maxPrice ");
        if(request.getCheckIn()!=null)room.append(" and ").append(SnapshotSourceQueryRepository.sufficientStockOnEveryNightSql());
        StringBuilder sql=new StringBuilder("""
            from accommodations a
            left join accommodation_type t on t.id=a.type_id
            join locations l on l.id=a.location_id
            join lateral (select min(r.nightly_price_cents) as nightly_price_cents from room r where
            """).append(room).append("""
            ) pricing on pricing.nightly_price_cents is not null
            left join lateral (select avg(rv.rating) as rating_average,count(*) as review_count from reviews rv
                where rv.accommodation_id=a.id and rv.rating between 1 and 5) ratings on true
            where a.status='active' and l.city is not null and l.city<>''
              and a.cleaning_fee_cents between 0 and 9007199254740991
              and a.service_fee_cents between 0 and 9007199254740991
              and a.timezone in (:supportedZones)
              and exists(select 1 from pg_timezone_names tz where tz.name=a.timezone)
            """);
        if(!request.getQ().isBlank())sql.append(" and (a.name ilike :query or a.address ilike :query or l.city ilike :query) ");
        if(request.getLocationId()!=null)sql.append(" and a.location_id=:locationId ");
        if(!request.getTypeIds().isEmpty())sql.append(" and a.type_id in (:typeIds) ");
        if(!request.getAmenityIds().isEmpty())sql.append("""
            and (select count(distinct af.features_id) from accommodation_features af
                 where af.accommodation_id=a.id and af.features_id in (:amenityIds))=:amenityCount
            """);
        if(request.getMinRating()!=null)sql.append(" and ratings.rating_average>=:minRating ");
        if("popular".equals(request.getSection()))sql.append(" and a.curated_popular_rank is not null ");
        if("recommended".equals(request.getSection()))sql.append(" and a.curated_recommended_rank is not null ");
        if(request.getCheckIn()!=null)sql.append(" and cast(:checkIn as date)>=(cast(:now as timestamptz) at time zone a.timezone)::date ");
        return sql.toString();
    }
    private static MapSqlParameterSource parameters(AccommodationSearchRequest r,UUID viewer,Instant now) {
        return new MapSqlParameterSource().addValue("viewerId",viewer).addValue("rooms",r.getRooms())
            .addValue("guestCount",r.getAdults()+r.getChildren()).addValue("minPrice",r.getMinPriceCents()).addValue("maxPrice",r.getMaxPriceCents())
            .addValue("query","%"+r.getQ()+"%").addValue("locationId",r.getLocationId()).addValue("typeIds",r.getTypeIds())
            .addValue("amenityIds",r.getAmenityIds()).addValue("amenityCount",r.getAmenityIds().size()).addValue("minRating",r.getMinRating())
            .addValue("checkIn",r.getCheckIn()).addValue("checkOut",r.getCheckOut())
            .addValue("now",OffsetDateTime.ofInstant(now,ZoneOffset.UTC)).addValue("supportedZones",ZoneId.getAvailableZoneIds());
    }
    private static StayCardResponse card(ResultSet row,int index) throws SQLException {
        java.math.BigDecimal rating=row.getBigDecimal("rating_average");
        return new StayCardResponse(row.getObject("id",UUID.class),row.getString("name"),row.getObject("type_id",UUID.class),
            row.getString("type_name"),row.getString("city"),row.getString("address"),row.getBigDecimal("latitude"),row.getBigDecimal("longitude"),
            MoneyUsd.cents(row.getLong("nightly_price_cents")),row.getString("cover_image_url"),rating==null?null:rating.doubleValue(),
            row.getLong("review_count"),row.getBoolean("is_favorite"));
    }
}
