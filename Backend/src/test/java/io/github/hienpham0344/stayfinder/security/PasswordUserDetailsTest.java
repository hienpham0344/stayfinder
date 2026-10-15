package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PasswordUserDetailsTest {
    private void credential(User user,String method,String value) {
        assertDoesNotThrow(()->User.class.getMethod(method,String.class).invoke(user,value),
                "Spring credentials must have explicit storage, never an empty placeholder password");
    }
    @Test void authenticatesStoredBcryptHashAndNormalizesEmailWithoutTrustingClientRole() {
        UserRepository repository=mock(UserRepository.class);
        User user=new User(); user.setEmail("user@example.com"); user.setRole(UserRole.CUSTOMER);
        String hash=new BCryptPasswordEncoder().encode("ExamplePass9");
        credential(user,"setPasswordHash",hash); credential(user,"setCredentialState","active");
        when(repository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        var details=new CustomUserDetailsService(repository).loadUserByUsername(" User@Example.com ");
        assertTrue(new BCryptPasswordEncoder().matches("ExamplePass9",details.getPassword()));
        assertTrue(details.isEnabled());
        assertEquals("ROLE_CUSTOMER",details.getAuthorities().iterator().next().getAuthority());
    }
    @Test void existingUnenrolledProfilesCannotAuthenticateWithAnEmptyPassword() {
        UserRepository repository=mock(UserRepository.class);
        User user=new User(); user.setEmail("user@example.com"); user.setRole(UserRole.CUSTOMER);
        credential(user,"setCredentialState","pending_enrollment");
        when(repository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        assertFalse(new CustomUserDetailsService(repository).loadUserByUsername("user@example.com").isEnabled());
    }
}
