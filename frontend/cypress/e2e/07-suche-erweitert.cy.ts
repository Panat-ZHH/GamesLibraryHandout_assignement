/// <reference types="cypress" />

/**
 * Erweiterte Sucheingaben sind testenswert, weil reale Nutzer:innen Sonderzeichen,
 * Umlaute oder kopierte lange Texte eingeben und die App dabei stabil bleiben muss.
 */
describe('Erweiterte Suche', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  it('verarbeitet Sonderzeichen und Umlaute ohne Crash', () => {
    cy.intercept('GET', '/api/games/search*').as('searchSpecialChars');

    cy.get('.search-bar__input').type('Zürich % < & äöü', { parseSpecialCharSequences: false });
    cy.get('.search-bar__button').click();
    cy.wait('@searchSpecialChars');

    cy.get('body').should('not.contain.text', 'Application error');
    cy.get('.home-page__headline').should('contain.text', 'Games Library');
    cy.get('.game-card, .game-list__status-title').should('exist');
  });

  it('verarbeitet sehr lange Suchbegriffe ohne hängenden Request', () => {
    const longSearchTerm = `SehrLangerSuchbegriff-${'x'.repeat(220)}`;

    cy.intercept('GET', '/api/games/search*').as('searchLongTerm');
    cy.get('.search-bar__input').type(longSearchTerm);
    cy.get('.search-bar__button').click();

    cy.wait('@searchLongTerm', { timeout: 8000 }).its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.get('.game-card, .game-list__status-title').should('exist');
  });

  it('löst die Suche erst per Such-Button oder Enter aus', () => {
    cy.intercept('GET', '/api/games/search*').as('searchOnSubmit');

    cy.get('.search-bar__input').type('Portal');
    cy.get('@searchOnSubmit.all').should('have.length', 0);

    cy.get('.search-bar__input').type('{enter}');
    cy.wait('@searchOnSubmit');
    cy.get('@searchOnSubmit.all').should('have.length', 1);

    cy.searchUntilNoGamesFound();
  });
});
