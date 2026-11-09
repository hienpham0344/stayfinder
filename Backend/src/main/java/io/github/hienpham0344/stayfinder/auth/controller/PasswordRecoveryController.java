package io.github.hienpham0344.stayfinder.auth.controller;

import io.github.hienpham0344.stayfinder.auth.service.SupabaseAuthService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.security.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
@ConditionalOnProperty(name="stayfinder.auth.mode",havingValue="supabase")
public class PasswordRecoveryController {
    private final SupabaseAuthService auth;private final AuthTransport transport;private final AuthAttemptLimiter limiter;
    public PasswordRecoveryController(SupabaseAuthService auth,AuthTransport transport,AuthAttemptLimiter limiter){this.auth=auth;this.transport=transport;this.limiter=limiter;}
    public record ForgotPassword(@NotBlank @Email @Size(max=320) String email){}
    public record ResetPassword(@NotBlank @Size(max=2048) String tokenHash,@NotBlank @Size(min=12,max=128) String password){}
    @PostMapping("/forgot-password") public ApiResponse<Void> forgot(@Valid @RequestBody ForgotPassword body,HttpServletRequest request,HttpServletResponse response){
        transport.platform(request);limiter.registration(request.getRemoteAddr());response.setHeader("Cache-Control","no-store");
        auth.recover(body.email());return ApiResponse.success(null);
    }
    @PostMapping("/reset-password") public ApiResponse<Void> reset(@Valid @RequestBody ResetPassword body,HttpServletRequest request,HttpServletResponse response){
        transport.platform(request);limiter.registration(request.getRemoteAddr());response.setHeader("Cache-Control","no-store");
        auth.reset(body.tokenHash(),body.password());transport.clearCookie(request,response);return ApiResponse.success(null);
    }
}
