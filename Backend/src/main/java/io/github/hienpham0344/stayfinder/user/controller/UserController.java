package io.github.hienpham0344.stayfinder.user.controller;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @org.springframework.web.bind.annotation.PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> update(@jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody
            io.github.hienpham0344.stayfinder.user.dto.UserProfilePatch request) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> currentUser() {
        return ResponseEntity.ok(ApiResponse.success(userService.getCurrentUser()));
    }
}
