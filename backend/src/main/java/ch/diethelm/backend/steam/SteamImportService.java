package ch.diethelm.backend.steam;

import ch.diethelm.backend.model.Game;
import ch.diethelm.backend.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

/**
 * Importiert ein Spiel aus dem steam-service in die Sammlung.
 *
 * <p>Fehler beim Aufruf werden in eine {@link SteamImportException} übersetzt:</p>
 * <ul>
 *   <li>steam-service nicht erreichbar oder zu langsam → 503</li>
 *   <li>steam-service antwortet mit einem Fehlerstatus → 502</li>
 *   <li>Spiel bei Steam unbekannt → 404</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class SteamImportService {

    // Steam liefert das Datum als Text, z. B. "18 Apr, 2011"
    private static final DateTimeFormatter STEAM_DATE = DateTimeFormatter.ofPattern("d MMM, yyyy", Locale.ENGLISH);

    private final SteamApi steamApi;
    private final GameRepository gameRepository;

    public Game importGame(long appId) {
        SteamEntry entry = fetch(appId).get(String.valueOf(appId));
        if (entry == null || !entry.success() || entry.data() == null) {
            throw new SteamImportException(HttpStatus.NOT_FOUND, "Spiel nicht gefunden");
        }

        SteamEntry.Data data = entry.data();
        Game game = Game.builder()
                .title(data.name())
                .description(data.shortDescription())
                .imageUrl(data.headerImage())
                .releaseDate(LocalDate.parse(data.releaseDate().date(), STEAM_DATE))
                .build();
        return gameRepository.save(game);
    }

    private Map<String, SteamEntry> fetch(long appId) {
        try {
            Map<String, SteamEntry> response = steamApi.game(appId);
            return response != null ? response : Map.of();
        } catch (ResourceAccessException | IllegalStateException e) {
            // keine Instanz bei Eureka, Prozess weg oder Read-Timeout
            throw new SteamImportException(HttpStatus.SERVICE_UNAVAILABLE, "steam-service nicht erreichbar", e);
        } catch (RestClientResponseException e) {
            throw new SteamImportException(HttpStatus.BAD_GATEWAY, "steam-service hat mit Fehler geantwortet", e);
        }
    }
}
