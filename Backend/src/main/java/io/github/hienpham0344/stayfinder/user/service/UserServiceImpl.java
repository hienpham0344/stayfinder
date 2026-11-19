package io.github.hienpham0344.stayfinder.user.service;

import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.dto.UpdateProfileRequest;
import io.github.hienpham0344.stayfinder.user.dto.ChangePasswordRequest;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        User user = userRepository.findById(CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = currentForUpdate();
        if (request.fullName() == null && request.phone() == null && request.avatarUrl() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        if (request.fullName() != null) {
            if (request.fullName().isBlank() || request.fullName().length() > 100) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR);
            }
            user.setFullName(request.fullName().trim());
        }
        if (request.phone() != null) user.setPhone(request.phone().trim());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl().trim());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = currentForUpdate();
        if (request.currentPassword() == null || user.getPasswordHash() == null
                || request.currentPassword().getBytes(StandardCharsets.UTF_8).length > 72
                || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        String password = request.newPassword();
        if (password == null || password.length() < 8
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setAuthVersion(Math.addExact(user.getAuthVersion(), 1));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void logoutAll() {
        User user = currentForUpdate();
        user.setAuthVersion(Math.addExact(user.getAuthVersion(), 1));
        userRepository.save(user);
    }

    private User currentForUpdate() {
        User user = userRepository.lockById(CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!user.isEnabled()) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        return user;
    }
}
