package ch.diethelm.backend.steam;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.util.Map;

/**
 * HTTP Interface für den steam-service.
 *
 * <p>Spring erzeugt die Implementierung zur Laufzeit (siehe {@link SteamClientConfig}).
 * Ein Aufruf {@code game(620)} wird zu {@code GET http://steam-service/api/steam/game/620}.</p>
 */
@HttpExchange("/api/steam")
public interface SteamApi {

    // Schlüssel der Map ist die AppID als Text, z. B. "620"
    @GetExchange("/game/{appId}")
    Map<String, SteamEntry> game(@PathVariable long appId);
}
