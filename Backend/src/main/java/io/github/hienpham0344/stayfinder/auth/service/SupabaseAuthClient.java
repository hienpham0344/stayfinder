package io.github.hienpham0344.stayfinder.auth.service;

import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.security.SupabaseJwtDecoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.JsonNode;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.Map;

/** Public Auth API only. Never uses a service-role key or returns upstream errors/secrets. */
@Component @ConditionalOnProperty(name="stayfinder.auth.mode",havingValue="supabase")
public class SupabaseAuthClient {
    private final String base,key; private final JsonMapper json;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
    public SupabaseAuthClient(@Value("${stayfinder.auth.supabase.url}") String url,
            @Value("${stayfinder.auth.supabase.publishable-key}") String key,JsonMapper json){
        this.base=SupabaseJwtDecoder.validatedUrl(url)+"/auth/v1";this.key=key;this.json=json;
        if(key==null||key.isBlank())throw new IllegalArgumentException("Supabase publishable key required");
    }
    public JsonNode call(String method,String path,Map<String,?> body,String access){
        try{
            var request=HttpRequest.newBuilder(URI.create(base+path)).timeout(Duration.ofSeconds(10))
                .header("apikey",key).header("Content-Type","application/json");
            if(access!=null)request.header("Authorization","Bearer "+access);
            request.method(method,HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
            var response=http.send(request.build(),HttpResponse.BodyHandlers.ofString());
            if(response.statusCode()==429)throw new BusinessException(ErrorCode.RATE_LIMITED);
            if(response.statusCode()>=500)throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
            if(response.statusCode()<200||response.statusCode()>=300)throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
            return response.body().isBlank()?json.createObjectNode():json.readTree(response.body());
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
        catch(java.io.IOException e){throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
    }
}
