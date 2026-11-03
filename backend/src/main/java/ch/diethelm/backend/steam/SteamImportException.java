package ch.diethelm.backend.steam;

import org.springframework.http.HttpStatus;

/**
 * Fehler beim Import aus dem steam-service. Trägt den HTTP-Status,
 * mit dem der games-service dem Client antwortet.
 */
public class SteamImportException extends RuntimeException {

    private final HttpStatus status;

    public SteamImportException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public SteamImportException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
