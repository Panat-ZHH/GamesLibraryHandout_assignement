package ch.diethelm.backend.service;

public class TitleNormalizer {

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Titel darf nicht leer sein");
        }
        String title = raw.trim().replaceAll("\\s+", " ");
        return Character.toUpperCase(title.charAt(0)) + title.substring(1);
    }
}
