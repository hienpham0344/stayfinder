package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private static final String DUMMY_PASSWORD_HASH = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
            .encode("stayfinder-dummy-login-not-an-account");
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
    }

    @Transactional
    public AuthResponse register(String fullName, String email, String password) {
        return register(fullName, email, password, UserRole.CUSTOMER);
    }

    @Transactional
    public AuthResponse register(String fullName, String email, String password, UserRole role) {
        String normalizedEmail = normalizeEmail(email);
        if (fullName == null || fullName.isBlank() || fullName.length() > 100 || !validPassword(password)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName(fullName.trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role != null ? role : UserRole.CUSTOMER);
        user.setLoyaltyPoints(0);
        user.setLoyaltyTier(1);
        user.setCreatedAt(Instant.now());
        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        if (password == null || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        boolean eligible = user != null && user.isEnabled() && user.getRole() != null && user.getPasswordHash() != null;
        boolean matches = passwordEncoder.matches(password, eligible ? user.getPasswordHash() : DUMMY_PASSWORD_HASH);
        if (!eligible || !matches) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return toResponse(user);
    }

    private AuthResponse toResponse(User user) {
        UserRole role = user.getRole() == null ? UserRole.CUSTOMER : user.getRole();
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail(), role, user.getAuthVersion()),
                userMapper.toResponse(user));
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean validPassword(String password) {
        if (password == null || password.length() < 8) return false;
        return password.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}
