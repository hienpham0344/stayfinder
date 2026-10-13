package io.github.hienpham0344.stayfinder.review.dto;import java.time.Instant;import java.util.*;
public record ReviewResponse(UUID id,UUID accommodationId,String userName,String userAvatarUrl,Integer rating,String comment,Instant createdAt,List<String> imageUrls,boolean isMine){}
