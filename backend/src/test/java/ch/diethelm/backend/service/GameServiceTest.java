package ch.diethelm.backend.service;

import ch.diethelm.backend.model.Game;
import ch.diethelm.backend.repository.GameRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;

    @InjectMocks
    private GameService gameService;

    @Test
    void getAllGamesReturnsGamesFromRepository() {
        List<Game> games = List.of(game("Minecraft"), game("Portal"));
        when(gameRepository.findAll()).thenReturn(games);

        List<Game> result = gameService.getAllGames();

        assertSame(games, result);
        verify(gameRepository).findAll();
    }

    @Test
    void getGameByIdReturnsExistingGame() {
        Long id = 1L;
        Game game = game("Minecraft");
        when(gameRepository.findById(id)).thenReturn(Optional.of(game));

        Game result = gameService.getGameById(id);

        assertSame(game, result);
        verify(gameRepository).findById(id);
    }

    @Test
    void getGameByIdThrowsWhenGameDoesNotExist() {
        Long id = 99L;
        when(gameRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> gameService.getGameById(id));
        verify(gameRepository).findById(id);
    }

    @Test
    void createGameSavesAndReturnsSavedGame() {
        Game game = game("Minecraft");
        Game savedGame = game("Minecraft");
        savedGame.setId(1L);
        when(gameRepository.save(game)).thenReturn(savedGame);

        Game result = gameService.createGame(game);

        assertSame(savedGame, result);
        verify(gameRepository).save(game);
    }

    @Test
    void updateGameOverwritesAllFieldsAndReturnsSavedGame() {
        Long id = 1L;
        Game existingGame = Game.builder()
                .id(id)
                .title("Old title")
                .description("Old description")
                .imageUrl("old-image.jpg")
                .releaseDate(LocalDate.of(2020, 1, 1))
                .build();
        Game updatedGame = Game.builder()
                .title("New title")
                .description("New description")
                .imageUrl("new-image.jpg")
                .releaseDate(LocalDate.of(2024, 2, 3))
                .build();
        when(gameRepository.findById(id)).thenReturn(Optional.of(existingGame));
        when(gameRepository.save(existingGame)).thenReturn(existingGame);

        Game result = gameService.updateGame(id, updatedGame);

        assertSame(existingGame, result);
        assertEquals(id, existingGame.getId());
        assertEquals(updatedGame.getTitle(), existingGame.getTitle());
        assertEquals(updatedGame.getDescription(), existingGame.getDescription());
        assertEquals(updatedGame.getImageUrl(), existingGame.getImageUrl());
        assertEquals(updatedGame.getReleaseDate(), existingGame.getReleaseDate());
        verify(gameRepository).findById(id);
        verify(gameRepository).save(existingGame);
    }

    @Test
    void updateGameThrowsWhenGameDoesNotExist() {
        Long id = 99L;
        when(gameRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class,
                () -> gameService.updateGame(id, game("Updated title")));
        verify(gameRepository).findById(id);
        verifyNoMoreInteractions(gameRepository);
    }

    @Test
    void deleteGameDeletesExistingGame() {
        Long id = 1L;
        when(gameRepository.existsById(id)).thenReturn(true);

        gameService.deleteGame(id);

        verify(gameRepository).existsById(id);
        verify(gameRepository).deleteById(id);
    }

    @Test
    void deleteGameThrowsWhenGameDoesNotExist() {
        Long id = 99L;
        when(gameRepository.existsById(id)).thenReturn(false);

        assertThrows(NoSuchElementException.class, () -> gameService.deleteGame(id));
        verify(gameRepository).existsById(id);
        verifyNoMoreInteractions(gameRepository);
    }

    @Test
    void searchByTitleDelegatesToRepository() {
        String title = "mine";
        List<Game> games = List.of(game("Minecraft"));
        when(gameRepository.findByTitleContainingIgnoreCase(title)).thenReturn(games);

        List<Game> result = gameService.searchByTitle(title);

        assertSame(games, result);
        verify(gameRepository).findByTitleContainingIgnoreCase(title);
    }

    private static Game game(String title) {
        return Game.builder()
                .title(title)
                .description("Description")
                .imageUrl("image.jpg")
                .releaseDate(LocalDate.of(2020, 1, 1))
                .build();
    }
}
