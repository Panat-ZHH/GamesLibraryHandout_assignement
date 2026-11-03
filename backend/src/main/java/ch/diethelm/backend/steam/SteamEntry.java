package ch.diethelm.backend.steam;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Ein Eintrag aus der Antwort von {@code GET /api/steam/game/{appId}} des steam-service.
 *
 * <p>Die Antwort hat die AppID als Schlüssel auf oberster Ebene, darunter
 * {@code success} und {@code data}. Es werden nur die Felder abgebildet,
 * die für den Import gebraucht werden.</p>
 */
public record SteamEntry(boolean success, Data data) {

    public record Data(String name,
                       @JsonProperty("short_description") String shortDescription,
                       @JsonProperty("header_image") String headerImage,
                       @JsonProperty("release_date") ReleaseDate releaseDate) { }

    public record ReleaseDate(String date) { }
}
