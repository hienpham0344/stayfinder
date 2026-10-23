package io.github.hienpham0344.stayfinder.auth.dto;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import java.time.Instant;
import java.util.UUID;
public record AuthSessionResponse(String accessToken,String tokenType,Instant expiresAt,UUID sessionId,
        UserResponse user,@JsonInclude(JsonInclude.Include.NON_NULL) String refreshToken) {
    public AuthSessionResponse withoutRefreshToken(){return new AuthSessionResponse(accessToken,tokenType,expiresAt,sessionId,user,null);}
}
