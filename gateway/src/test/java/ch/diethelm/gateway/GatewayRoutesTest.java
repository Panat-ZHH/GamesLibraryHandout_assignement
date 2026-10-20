package ch.diethelm.gateway;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;

@SpringBootTest(properties = "eureka.client.enabled=false")
class GatewayRoutesTest {

    @Autowired
    private RouteLocator routeLocator;

    @Test
    void routesForGamesAndSteamAreDefined() {
        List<String> ids = routeLocator.getRoutes()
                .map(Route::getId)
                .collectList()
                .block();

        assertNotNull(ids, "RouteLocator hat keine Routen geliefert");
        assertTrue(ids.contains("games"), "Route games fehlt: " + ids);
        assertTrue(ids.contains("steam"), "Route steam fehlt: " + ids);
    }
}
