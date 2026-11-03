package ch.diethelm.backend.steam;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import java.time.Duration;

/**
 * Baut den Client für den steam-service.
 *
 * <p>Der {@code @LoadBalanced}-Builder ersetzt den Host {@code steam-service} bei jedem
 * Aufruf durch host:port einer Instanz aus Eureka. Der normale Builder ist {@code @Primary},
 * damit der Eureka-Client selbst nicht über den Load Balancer geht.</p>
 */
@Configuration
class SteamClientConfig {

    @Bean
    @Primary
    RestClient.Builder plainRestClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    @LoadBalanced
    RestClient.Builder lbRestClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    SteamApi steamApi(@LoadBalanced RestClient.Builder builder,
                      @Value("${gameslibrary.steam.base-url:http://steam-service}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(1));
        factory.setReadTimeout(Duration.ofSeconds(2));

        RestClient client = builder.baseUrl(baseUrl).requestFactory(factory).build();
        HttpServiceProxyFactory proxyFactory = HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(client))
                .build();
        return proxyFactory.createClient(SteamApi.class);
    }
}
