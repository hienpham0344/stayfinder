package io.github.hienpham0344.stayfinder.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

@Configuration
public class JacksonConfig {
    @Bean
    JsonMapper objectMapper() {
        return JsonMapper.builder().findAndAddModules().build();
    }
}
