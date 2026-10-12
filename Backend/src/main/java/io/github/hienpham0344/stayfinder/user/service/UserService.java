package io.github.hienpham0344.stayfinder.user.service;

import io.github.hienpham0344.stayfinder.user.dto.UserResponse;

public interface UserService {
    UserResponse getCurrentUser();
    UserResponse updateProfile(io.github.hienpham0344.stayfinder.user.dto.UserProfilePatch request);
}
