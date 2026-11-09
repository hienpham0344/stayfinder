package io.github.hienpham0344.stayfinder.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.*;

/** Pins issuer and asymmetric algorithms. JWKS is fetched on first decode, never at startup. */
@Component
@ConditionalOnProperty(name="stayfinder.auth.mode",havingValue="supabase")
public class SupabaseJwtDecoder implements JwtDecoder {
    private final NimbusJwtDecoder delegate;
    @org.springframework.beans.factory.annotation.Autowired
    public SupabaseJwtDecoder(@Value("${stayfinder.auth.supabase.url}") String url, Clock clock) {
        this(NimbusJwtDecoder.withJwkSetUri(validatedUrl(url)+"/auth/v1/.well-known/jwks.json")
            .jwsAlgorithms(a->{a.clear();a.add(SignatureAlgorithm.RS256);a.add(SignatureAlgorithm.ES256);}).build(),validatedUrl(url)+"/auth/v1",clock);
    }
    SupabaseJwtDecoder(NimbusJwtDecoder delegate,String issuer,Clock clock){
        this.delegate=delegate;
        JwtTimestampValidator timestamp=new JwtTimestampValidator(Duration.ZERO);timestamp.setClock(clock);
        delegate.setJwtValidator(new DelegatingOAuth2TokenValidator<>(timestamp,new JwtIssuerValidator(issuer),
            new JwtClaimValidator<List<String>>("aud",v->v!=null&&v.contains("authenticated")),
            new JwtClaimValidator<String>("sub",SupabaseJwtDecoder::uuid),
            new JwtClaimValidator<String>("session_id",SupabaseJwtDecoder::uuid),
            token-> token.getExpiresAt()!=null&&token.getIssuedAt()!=null&&!token.getIssuedAt().isAfter(clock.instant())
                &&token.getExpiresAt().isAfter(token.getIssuedAt())?OAuth2TokenValidatorResult.success():
                OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"))));
    }
    public Jwt decode(String token){return delegate.decode(token);}
    public static String validatedUrl(String value){
        var uri=java.net.URI.create(value);
        if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null||uri.getQuery()!=null||uri.getFragment()!=null
            ||!(uri.getPath().isEmpty()||uri.getPath().equals("/")))throw new IllegalArgumentException("Supabase requires an HTTPS project origin");
        return value.replaceAll("/+$","");
    }
    private static boolean uuid(String v){try{return v!=null&&UUID.fromString(v).toString().equals(v);}catch(IllegalArgumentException e){return false;}}
}
