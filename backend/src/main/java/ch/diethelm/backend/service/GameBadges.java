package ch.diethelm.backend.service;

import ch.diethelm.backend.model.Game;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class GameBadges {

    public boolean isNew(Game game) {
        long days = ChronoUnit.DAYS.between(
                game.getReleaseDate(), LocalDate.now());
        return days <= 30;
    }
}
