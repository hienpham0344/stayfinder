package io.github.hienpham0344.stayfinder.auth.service;
import io.github.hienpham0344.stayfinder.auth.dto.*;
import java.util.UUID;
public interface AuthService {
    AuthSessionResponse register(RegisterRequest request);
    AuthSessionResponse login(LoginRequest request);
    AuthSessionResponse refresh(String rawRefreshToken);
    void logout(String rawRefreshToken);
    void changePassword(UUID userId,PasswordChangeRequest request);
    void changeEmail(UUID userId,EmailChangeRequest request);
}
