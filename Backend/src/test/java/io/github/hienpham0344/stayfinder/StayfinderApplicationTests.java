package io.github.hienpham0344.stayfinder;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.security.jwt.secret-base64="
        + "c3RheWZpbmRlci10ZXN0LXNlY3JldC13aXRoLWF0LWxlYXN0LTI1Ni1iaXRzLTEyMzQ1Ng==")
@EnabledIfSystemProperty(named = "stayfinder.integration", matches = "true")
class StayfinderApplicationTests {

	@Test
	void contextLoads() {
	}

}
