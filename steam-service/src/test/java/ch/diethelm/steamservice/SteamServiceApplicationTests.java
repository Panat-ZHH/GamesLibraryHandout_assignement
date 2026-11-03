package ch.diethelm.steamservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "eureka.client.enabled=false")
class SteamServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
