package io.github.hienpham0344.stayfinder.review.mapper;
import io.github.hienpham0344.stayfinder.review.dto.ReviewResponse;import io.github.hienpham0344.stayfinder.review.entity.Review;import io.github.hienpham0344.stayfinder.user.entity.User;import org.mapstruct.*;import java.util.List;
@Mapper(componentModel="spring")public interface ReviewMapper{
 @Mapping(target="id",source="entity.id")@Mapping(target="accommodationId",source="entity.accommodationId")@Mapping(target="createdAt",source="entity.createdAt")
 @Mapping(target="comment",expression="java(entity.getComment()==null ? \"\" : entity.getComment())")
 @Mapping(target="userName",source="author.fullName")@Mapping(target="userAvatarUrl",source="author.avatarUrl")@Mapping(target="imageUrls",source="imageUrls")@Mapping(target="isMine",source="isMine")
 ReviewResponse toResponse(Review entity,User author,List<String> imageUrls,boolean isMine);
}
