package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import io.github.hienpham0344.stayfinder.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final AuthRateLimiter rateLimiter;
    private final UserService userService;

    public AuthController(AuthService authService, AuthRateLimiter rateLimiter, UserService userService) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                             HttpServletRequest httpRequest) {
        rateLimiter.checkRegistration(httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                authService.register(request.fullName(), request.email(), request.password())));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                          HttpServletRequest httpRequest) {
        rateLimiter.checkLogin(request.email(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success(authService.login(request.email(), request.password())));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        userService.logoutAll();
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
