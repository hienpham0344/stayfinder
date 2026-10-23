package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.auth.service.AuthServiceImpl;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import java.time.Clock;
import java.util.*;

@Component
public class CurrentUserJwtConverter implements Converter<Jwt,AbstractAuthenticationToken> {
    private final UserRepository users;
    private final RefreshSessionRepository sessions;
    private final Clock clock;
    public CurrentUserJwtConverter(UserRepository users,RefreshSessionRepository sessions,Clock clock) {
        this.users=users;this.sessions=sessions;this.clock=clock;
    }
    @Override public AbstractAuthenticationToken convert(Jwt jwt) {
        try {
            UUID userId=UUID.fromString(jwt.getSubject()),sessionId=UUID.fromString(jwt.getClaimAsString("sid"));
            var session=sessions.findById(sessionId).orElseThrow(CurrentUserJwtConverter::invalid);
            if(!userId.equals(session.getUserId())||session.getRevokedAt()!=null
                    ||session.getExpiresAt()==null||!clock.instant().isBefore(session.getExpiresAt()))throw invalid();
            var user=users.findById(userId).filter(AuthServiceImpl::active).orElseThrow(CurrentUserJwtConverter::invalid);
            CurrentUser principal=new CurrentUser(userId,user.getEmail(),user.getRole());
            return UsernamePasswordAuthenticationToken.authenticated(principal,null,
                    List.of(new SimpleGrantedAuthority("ROLE_"+user.getRole().name())));
        } catch(IllegalArgumentException exception){throw invalid();}
    }
    private static BadCredentialsException invalid(){return new BadCredentialsException("Session inactive");}
}
