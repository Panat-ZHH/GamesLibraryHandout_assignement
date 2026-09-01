// ***********************************************************
// Globale, benutzerdefinierte Cypress-Commands für die
// GamesLibrary E2E-Tests.
// ***********************************************************

/**
 * Öffnet die Anwendung und wartet, bis der initiale
 * GET /api/games-Aufruf abgeschlossen ist (Spiele geladen).
 */
Cypress.Commands.add('visitApp', () => {
  cy.intercept('GET', '/api/games').as('getGames');
  cy.visit('/');
  cy.wait('@getGames');
});

/**
 * Öffnet das "Add Game"-Formular über den Header-Button.
 */
Cypress.Commands.add('openAddGameForm', () => {
  cy.get('.home-page__add-btn').click();
  cy.get('.game-form').should('be.visible');
});

/**
 * Füllt das Spiel-Formular mit den übergebenen Werten aus.
 * Felder, die nicht übergeben werden, bleiben unverändert.
 */
Cypress.Commands.add('fillGameForm', (game: {
  title?: string;
  description?: string;
  imageUrl?: string;
  releaseDate?: string;
}) => {
  if (game.title !== undefined) {
    cy.get('.game-form input[name="title"]').clear();
    if (game.title) cy.get('.game-form input[name="title"]').type(game.title);
  }
  if (game.description !== undefined) {
    cy.get('.game-form textarea[name="description"]').clear();
    if (game.description) cy.get('.game-form textarea[name="description"]').type(game.description);
  }
  if (game.imageUrl !== undefined) {
    cy.get('.game-form input[name="imageUrl"]').clear();
    if (game.imageUrl) cy.get('.game-form input[name="imageUrl"]').type(game.imageUrl);
  }
  if (game.releaseDate !== undefined) {
    cy.get('.game-form input[name="releaseDate"]').clear();
    if (game.releaseDate) cy.get('.game-form input[name="releaseDate"]').type(game.releaseDate);
  }
});

/**
 * Löscht ein Spiel anhand seines Titels direkt über die API.
 * Wird für die Aufräumarbeiten nach Tests verwendet, damit die
 * Datenbank zwischen Testläufen sauber bleibt.
 */
Cypress.Commands.add('deleteGameByTitle', (title: string) => {
  cy.request('GET', '/api/games').then((res) => {
    const match = (res.body as Array<{ id: number; title: string }>).find(
      (g) => g.title === title
    );
    if (match) {
      cy.request('DELETE', `/api/games/${match.id}`);
    }
  });
});

/**
 * Führt eine Suche aus, die sicher keine Treffer liefert, und wartet
 * auf den leeren Ergebniszustand der Liste.
 */
Cypress.Commands.add('searchUntilNoGamesFound', (term = `KeinTreffer${Date.now()}`) => {
  cy.intercept('GET', '/api/games/search*').as('searchNoResults');
  cy.get('.search-bar__input').clear().type(term);
  cy.get('.search-bar__button').click();
  cy.wait('@searchNoResults');
  cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitApp(): Chainable<void>;
      openAddGameForm(): Chainable<void>;
      fillGameForm(game: {
        title?: string;
        description?: string;
        imageUrl?: string;
        releaseDate?: string;
      }): Chainable<void>;
      deleteGameByTitle(title: string): Chainable<void>;
      searchUntilNoGamesFound(term?: string): Chainable<void>;
    }
  }
}

export {};
