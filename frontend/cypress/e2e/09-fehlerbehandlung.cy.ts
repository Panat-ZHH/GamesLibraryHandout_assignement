/// <reference types="cypress" />

/**
 * Fehlerbehandlung ist testenswert, weil Server- und Netzwerkprobleme im Alltag
 * auftreten und Nutzer:innen dabei klare Rückmeldung statt Datenverlust brauchen.
 */
describe('Fehlerbehandlung', () => {
  const createdTitles: string[] = [];
  const uniqueSuffix = () => `${Date.now()}-${Cypress._.random(1000, 9999)}`;

  afterEach(() => {
    createdTitles.forEach((title) => cy.deleteGameByTitle(title));
    createdTitles.length = 0;
  });

  it('zeigt beim initialen Laden mit Serverfehler eine Fehlermeldung in der UI', () => {
    cy.intercept('GET', '/api/games', { statusCode: 500, body: {} }).as('loadError');

    cy.visit('/');
    cy.wait('@loadError');

    cy.get('.home-page__error').should('contain.text', 'Fehler beim Laden der Spiele.');
    cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
  });

  it('zeigt bei einem Serverfehler während der Suche eine sinnvolle Fehlermeldung', () => {
    cy.visitApp();
    cy.intercept('GET', '/api/games/search*', { statusCode: 500, body: {} }).as('searchError');

    cy.get('.search-bar__input').type('Serverfehler Suche');
    cy.get('.search-bar__button').click();
    cy.wait('@searchError');

    cy.get('.home-page__error').should('contain.text', 'Fehler bei der Suche.');
    cy.get('.home-page__headline').should('contain.text', 'Games Library');
    cy.get('.game-card, .game-list__status-title').should('exist');
  });

  it('behält Formulardaten bei einem Netzwerkfehler beim Erstellen', () => {
    const title = `Cypress Netzwerkfehler ${uniqueSuffix()}`;
    const description = `Bleibt erhalten ${uniqueSuffix()}`;
    createdTitles.push(title);

    cy.visitApp();
    cy.openAddGameForm();
    cy.fillGameForm({
      title,
      description,
      imageUrl: 'https://example.com/network-error.jpg',
      releaseDate: '2020-10-10',
    });
    cy.intercept('POST', '/api/games', { forceNetworkError: true }).as('createNetworkError');

    cy.get('.game-form__btn--submit').click();
    cy.wait('@createNetworkError');

    cy.get('.game-form').should('be.visible');
    cy.get('.home-page__error').should('contain.text', 'Fehler beim Erstellen des Spiels.');
    cy.get('.game-form input[name="title"]').should('have.value', title);
    cy.get('.game-form textarea[name="description"]').should('have.value', description);
    cy.get('.game-form input[name="imageUrl"]').should('have.value', 'https://example.com/network-error.jpg');
    cy.get('.game-form input[name="releaseDate"]').should('have.value', '2020-10-10');
    cy.contains('.game-card__title', title).should('not.exist');
  });

  it('zeigt während einer langsamen Suche einen Ladezustand', () => {
    cy.visitApp();
    cy.intercept('GET', '/api/games/search*', (req) => {
      req.reply({ delay: 600, statusCode: 200, body: [] });
    }).as('slowSearch');

    cy.get('.search-bar__input').type('Langsame Suche');
    cy.get('.search-bar__button').click();

    cy.get('.game-list__spinner').should('be.visible');
    cy.get('.game-list__status-title').should('contain.text', 'Loading Library');
    cy.wait('@slowSearch');
    cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
  });
});
