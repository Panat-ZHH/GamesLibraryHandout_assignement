package ch.diethelm.backend.service;

import ch.diethelm.backend.model.Game;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertTrue;

class GameBadgesTest {

    @Test
    void releasedLastWeek_isNew() {
        Game game = Game.builder().title("X")
                .releaseDate(LocalDate.of(2026, 10, 20)).build();
        assertTrue(new GameBadges().isNew(game));
    }
}
