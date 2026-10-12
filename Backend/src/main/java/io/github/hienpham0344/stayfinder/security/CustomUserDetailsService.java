package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.Locale;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    public CustomUserDetailsService(UserRepository userRepository){this.userRepository=userRepository;}
    @Override public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalized=email==null?"":email.trim().toLowerCase(Locale.ROOT);
        User user=userRepository.findByEmailIgnoreCase(normalized)
                .orElseThrow(()->new UsernameNotFoundException("Invalid credentials"));
        String hash=user.getPasswordHash();
        boolean enabled="active".equals(user.getCredentialState())&&hash!=null&&!hash.isBlank()&&user.getRole()!=null;
        return org.springframework.security.core.userdetails.User.withUsername(normalized)
                .password(hash==null?"":hash)
                .roles(user.getRole()==null?"CUSTOMER":user.getRole().name())
                .disabled(!enabled).build();
    }
}
