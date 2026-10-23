package io.github.hienpham0344.stayfinder.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
@Configuration @EnableScheduling
@ConditionalOnProperty(name="stayfinder.workers.enabled",havingValue="true",matchIfMissing=true)
public class WorkerSchedulingConfig {}
