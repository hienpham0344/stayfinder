package io.github.hienpham0344.stayfinder.partner.repository;

import io.github.hienpham0344.stayfinder.partner.dto.PartnerReviewResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public class PartnerReviewRepository {
    private final JdbcTemplate jdbc;
    public PartnerReviewRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public List<PartnerReviewResponse> list(UUID accommodationId, int page, int size) {
        return jdbc.query("""
            select r.id,r.rating,r.comment,r.created_at,p.reply,p.updated_at
            from reviews r left join partner_review_replies p on p.review_id=r.id
            where r.accommodation_id=? order by r.created_at desc,r.id limit ? offset ?
            """, (rs,row) -> new PartnerReviewResponse(rs.getObject(1,UUID.class),rs.getInt(2),rs.getString(3),
                rs.getTimestamp(4).toInstant(),rs.getString(5),rs.getTimestamp(6)==null?null:rs.getTimestamp(6).toInstant()),
            accommodationId,size,(long)page*size);
    }
    public void saveReply(UUID reviewId, UUID partnerId, String reply, Instant now) {
        jdbc.update("""
            insert into partner_review_replies(review_id,partner_id,reply,updated_at) values (?,?,?,?)
            on conflict(review_id) do update set partner_id=excluded.partner_id,reply=excluded.reply,updated_at=excluded.updated_at
            """,reviewId,partnerId,reply,Timestamp.from(now));
    }
    public java.util.Optional<PartnerReviewResponse> publicReply(UUID accommodationId, UUID reviewId) {
        return jdbc.query("""
            select r.id,r.rating,r.comment,r.created_at,p.reply,p.updated_at
            from reviews r join accommodations a on a.id=r.accommodation_id
            left join partner_review_replies p on p.review_id=r.id
            where r.id=? and a.id=? and a.status='active' and r.hidden=false
            """, (rs,row) -> new PartnerReviewResponse(rs.getObject(1,UUID.class),rs.getInt(2),rs.getString(3),
                rs.getTimestamp(4).toInstant(),rs.getString(5),rs.getTimestamp(6)==null?null:rs.getTimestamp(6).toInstant()),
            reviewId,accommodationId).stream().findFirst();
    }
}
