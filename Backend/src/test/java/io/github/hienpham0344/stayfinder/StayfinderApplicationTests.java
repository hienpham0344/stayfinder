package io.github.hienpham0344.stayfinder;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.security.jwt.secret-base64="
        + "c3RheWZpbmRlci10ZXN0LXNlY3JldC13aXRoLWF0LWxlYXN0LTI1Ni1iaXRzLTEyMzQ1Ng==")
class StayfinderApplicationTests {

	@Test
	void contextLoads() {
	}

}
