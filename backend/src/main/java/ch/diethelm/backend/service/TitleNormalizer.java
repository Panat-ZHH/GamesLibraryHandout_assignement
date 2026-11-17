package ch.diethelm.backend.service;

public class TitleNormalizer {

    public static String normalize(String raw) {
        return Character.toUpperCase(raw.trim().replaceAll("\\s+", " ").charAt(0))
                + raw.trim().replaceAll("\\s+", " ").substring(1);
    }
}
