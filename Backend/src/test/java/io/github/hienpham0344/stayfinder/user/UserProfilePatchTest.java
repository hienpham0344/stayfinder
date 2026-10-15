package io.github.hienpham0344.stayfinder.user;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.dto.UserProfilePatch;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.user.service.UserServiceImpl;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class UserProfilePatchTest {
    private final UserRepository users=mock(UserRepository.class);
    private final UserServiceImpl service=new UserServiceImpl(users,new io.github.hienpham0344.stayfinder.user.service.UserProfileProjection(Mappers.getMapper(UserMapper.class),mock(io.github.hienpham0344.stayfinder.reward.repository.RewardWalletRepository.class)));
    private final User user=new User();
    @BeforeEach void setup(){
        UUID id=UUID.randomUUID();user.setId(id);user.setFullName("Old");user.setEmail("account@example.com");user.setPhone("+84912345678");
        user.setRole(UserRole.CUSTOMER);user.setLoyaltyPoints(50);user.setPasswordHash("private-hash");user.setCredentialState("active");
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new CurrentUser(id,user.getEmail(),user.getRole()),null,List.of()));
        when(users.lockById(id)).thenReturn(Optional.of(user));when(users.save(any())).thenAnswer(i->i.getArgument(0));
    }
    @AfterEach void cleanup(){SecurityContextHolder.clearContext();}
    @Test void nameOnlyPatchPreservesPhoneCredentialsRoleEmailAndPoints() {
        UserProfilePatch patch=new UserProfilePatch();patch.setFullName(" Nguyễn Minh ");
        var result=assertDoesNotThrow(()->service.updateProfile(patch));
        assertNotNull(result);assertEquals("Nguyễn Minh",user.getFullName());assertEquals("+84912345678",user.getPhone());
        assertEquals("account@example.com",user.getEmail());assertEquals("private-hash",user.getPasswordHash());
        assertEquals(UserRole.CUSTOMER,user.getRole());assertEquals(50,user.getLoyaltyPoints());
    }
    @Test void explicitNullPhoneClearsContactWhileAbsentNameIsPreserved() {
        UserProfilePatch patch=new UserProfilePatch();patch.setPhone(null);
        assertDoesNotThrow(()->service.updateProfile(patch));assertNull(user.getPhone());assertEquals("Old",user.getFullName());
    }
    @Test void explicitBlankNameAndInvalidPhoneAreRejected() {
        UserProfilePatch blank=new UserProfilePatch();blank.setFullName(" ");
        assertThrows(BusinessException.class,()->service.updateProfile(blank));
        UserProfilePatch badPhone=new UserProfilePatch();badPhone.setPhone("abc");
        assertThrows(BusinessException.class,()->service.updateProfile(badPhone));
    }
}
