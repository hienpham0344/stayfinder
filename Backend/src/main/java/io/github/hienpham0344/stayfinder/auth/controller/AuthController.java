package io.github.hienpham0344.stayfinder.auth.controller;

import io.github.hienpham0344.stayfinder.auth.dto.*;
import io.github.hienpham0344.stayfinder.auth.service.AuthService;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.security.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final AuthTransport transport;
    private final AuthAttemptLimiter limiter;
    public AuthController(AuthService auth,AuthTransport transport,AuthAttemptLimiter limiter) {
        this.auth=auth;this.transport=transport;this.limiter=limiter;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> register(@Valid @RequestBody RegisterRequest body,
            HttpServletRequest request,HttpServletResponse response) {
        transport.platform(request);limiter.registration(request.getRemoteAddr());
        return ResponseEntity.status(201).body(ApiResponse.success(transport.writeSession(request,response,auth.register(body))));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> login(@Valid @RequestBody LoginRequest body,
            HttpServletRequest request,HttpServletResponse response) {
        transport.platform(request);limiter.checkLogin(body.email(),request.getRemoteAddr());
        try {
            return ResponseEntity.ok(ApiResponse.success(transport.writeSession(request,response,auth.login(body))));
        } catch(BusinessException exception) {
            if(exception.getErrorCode()==ErrorCode.INVALID_CREDENTIALS)limiter.recordLoginFailure(body.email(),request.getRemoteAddr());
            throw exception;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> refresh(@RequestBody(required=false) RefreshRequest body,
            HttpServletRequest request,HttpServletResponse response) {
        String token=transport.readRefresh(request,body);
        return ResponseEntity.ok(ApiResponse.success(transport.writeSession(request,response,auth.refresh(token))));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required=false) RefreshRequest body,
            HttpServletRequest request,HttpServletResponse response) {
        auth.logout(transport.readRefresh(request,body));transport.clearCookie(request,response);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/password") @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> password(@Valid @RequestBody PasswordChangeRequest body,
            HttpServletRequest request,HttpServletResponse response) {
        transport.platform(request);var user=CurrentUser.require();limiter.credentialChange(user.id(),request.getRemoteAddr());
        auth.changePassword(user.id(),body);transport.clearCookie(request,response);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/email-change") @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> email(@Valid @RequestBody EmailChangeRequest body,
            HttpServletRequest request,HttpServletResponse response) {
        transport.platform(request);var user=CurrentUser.require();limiter.credentialChange(user.id(),request.getRemoteAddr());
        auth.changeEmail(user.id(),body);transport.clearCookie(request,response);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
