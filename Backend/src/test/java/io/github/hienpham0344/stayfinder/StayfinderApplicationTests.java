package io.github.hienpham0344.stayfinder;
import io.github.hienpham0344.stayfinder.testsupport.ApprovedPostgresContext;
import io.github.hienpham0344.stayfinder.testsupport.ApprovedPostgresInitializer;
import org.junit.jupiter.api.Tag;import org.junit.jupiter.api.Test;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.context.annotation.Import;import org.springframework.test.context.ContextConfiguration;
/** Startup is verified only against the explicitly approved private schema. */
@Tag("postgres") @SpringBootTest
@ContextConfiguration(initializers=ApprovedPostgresInitializer.class) @Import(ApprovedPostgresContext.class)
class StayfinderApplicationTests{
 @Test void contextLoads(){}
}
