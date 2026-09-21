package io.github.hienpham0344.stayfinder.user;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class UserMapperTest {
    private final UserMapper mapper = Mappers.getMapper(UserMapper.class);

    @Test
    void mapsPublicUserFieldsAndNeverExposesASecretField() {
        UUID id = UUID.randomUUID();
        User user = new User();
        user.setId(id);
        user.setFullName("Hien Pham");
        user.setEmail("hien@example.com");
        user.setRole(UserRole.CUSTOMER);
        user.setLoyaltyPoints(10);

        UserResponse response = mapper.toResponse(user);

        assertEquals(id, response.id());
        assertEquals("hien@example.com", response.email());
        assertEquals(UserRole.CUSTOMER, response.role());
        assertEquals(10, response.loyaltyPoints());
        assertFalse(java.util.Arrays.stream(UserResponse.class.getDeclaredFields())
                .anyMatch(field -> field.getName().toLowerCase().contains("password")));
    }
}
