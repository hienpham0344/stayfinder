package io.github.hienpham0344.stayfinder.user.service;

import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.dto.UpdateProfileRequest;
import io.github.hienpham0344.stayfinder.user.dto.ChangePasswordRequest;

public interface UserService {
    UserResponse getCurrentUser();
    UserResponse updateProfile(UpdateProfileRequest request);
    void changePassword(ChangePasswordRequest request);
    void logoutAll();
}
