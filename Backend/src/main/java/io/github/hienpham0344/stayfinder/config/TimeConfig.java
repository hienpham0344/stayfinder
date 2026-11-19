package io.github.hienpham0344.stayfinder.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.time.Clock;

@Configuration
@EnableScheduling
public class TimeConfig {
    @Bean
    Clock clock() { return Clock.systemUTC(); }
}
