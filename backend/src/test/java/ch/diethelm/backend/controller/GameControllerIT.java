package ch.diethelm.backend.controller;

import ch.diethelm.backend.model.Game;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GameControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void postGameWithValidDataReturns201AndGeneratedId() throws Exception {
        Game game = Game.builder()
                .title("Integration Test Game " + System.nanoTime())
                .description("Beschreibung für Integrationstest")
                .imageUrl("https://example.com/cover.jpg")
                .releaseDate(LocalDate.of(2021, 5, 20))
                .build();

        mockMvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(game)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", greaterThan(0)))
                .andExpect(jsonPath("$.title").value(game.getTitle()))
                .andExpect(jsonPath("$.releaseDate").value("2021-05-20"));
    }

    @Test
    void postGameWithoutTitleReturns400() throws Exception {
        Game game = Game.builder()
                .description("Ohne Titel")
                .imageUrl("https://example.com/cover.jpg")
                .releaseDate(LocalDate.of(2021, 5, 20))
                .build();

        mockMvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(game)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.title").value("Titel darf nicht leer sein"));
    }

    @Test
    void postGameWithFutureReleaseDateReturns400() throws Exception {
        Game game = Game.builder()
                .title("Zukunftsspiel")
                .description("Datum in der Zukunft")
                .imageUrl("https://example.com/cover.jpg")
                .releaseDate(LocalDate.now().plusYears(1))
                .build();

        mockMvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(game)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getGameByIdWithMissingIdReturns404() throws Exception {
        mockMvc.perform(get("/api/games/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("nicht gefunden")));
    }

    @Test
    void searchByTitleIsCaseInsensitive() throws Exception {
        mockMvc.perform(get("/api/games/search").param("title", "WITCHER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("The Witcher 3: Wild Hunt"));
    }

    @Test
    void putGameUpdatesExistingGame() throws Exception {
        Game created = Game.builder()
                .title("Original Titel " + System.nanoTime())
                .description("Vorher")
                .imageUrl("https://example.com/old.jpg")
                .releaseDate(LocalDate.of(2020, 1, 1))
                .build();

        String createdJson = mockMvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Game createdGame = objectMapper.readValue(createdJson, Game.class);

        Game updated = Game.builder()
                .title("Aktualisierter Titel")
                .description("Nachher")
                .imageUrl("https://example.com/new.jpg")
                .releaseDate(LocalDate.of(2024, 4, 15))
                .build();

        mockMvc.perform(put("/api/games/{id}", createdGame.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Aktualisierter Titel"))
                .andExpect(jsonPath("$.description").value("Nachher"));

        mockMvc.perform(get("/api/games/{id}", createdGame.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Aktualisierter Titel"))
                .andExpect(jsonPath("$.imageUrl").value("https://example.com/new.jpg"));
    }

    @Test
    void deleteGameRemovesExistingGameAndSecondDeleteReturns404() throws Exception {
        Game created = Game.builder()
                .title("Delete Test " + System.nanoTime())
                .description("Zum Löschen")
                .imageUrl("https://example.com/delete.jpg")
                .releaseDate(LocalDate.of(2019, 10, 5))
                .build();

        String createdJson = mockMvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Game createdGame = objectMapper.readValue(createdJson, Game.class);

        mockMvc.perform(delete("/api/games/{id}", createdGame.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/games/{id}", createdGame.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("nicht gefunden")));
    }
}
