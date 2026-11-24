package ch.diethelm.backend.service;

import ch.diethelm.backend.model.Game;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class GameBadges {

    private final Clock clock;

    public GameBadges(Clock clock) {
        this.clock = clock;
    }

    public boolean isNew(Game game) {
        long days = ChronoUnit.DAYS.between(
                game.getReleaseDate(), LocalDate.now(clock));
        return days <= 30;
    }
}
