package ch.diethelm.backend.service;

public class TitleNormalizer {

    public static String normalize(String raw) {
        String title = raw.trim().replaceAll("\\s+", " ");
        return Character.toUpperCase(title.charAt(0)) + title.substring(1);
    }
}
