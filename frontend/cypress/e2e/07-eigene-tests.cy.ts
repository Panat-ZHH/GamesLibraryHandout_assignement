/// <reference types="cypress" />

describe('Eigene E2E-Tests', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  it('findet Spiele auch bei längeren bzw. Sonderzeichen-Suchbegriffen', () => {
    cy.intercept('GET', '/api/games/search*').as('search');
    cy.get('.search-bar__input').type('The Witcher 3: Wild Hunt');
    cy.get('.search-bar__button').click();
    cy.wait('@search');
    cy.contains('.game-card__title', 'The Witcher 3: Wild Hunt').should('be.visible');
  });

  it('bricht das Bearbeiten ab und lässt die Originaldaten unverändert', () => {
    const title = 'Original bearbeiten ' + Date.now();
    cy.openAddGameForm();
    cy.fillGameForm({ title, releaseDate: '2021-02-02' });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__btn--edit').click();
    });

    cy.fillGameForm({ title: 'Geändert aber abgebrochen', releaseDate: '2022-02-02' });
    cy.get('.game-form__btn--cancel').click();

    cy.contains('.game-card__title', title).should('be.visible');
    cy.contains('.game-card__title', 'Geändert aber abgebrochen').should('not.exist');
    cy.deleteGameByTitle(title);
  });

  it('zeigt eine Fehlermeldung, wenn das Laden der Spiele mit 500 fehlschlägt', () => {
    cy.intercept('GET', '/api/games', { statusCode: 500, body: {} }).as('loadError');
    cy.visit('/');
    cy.wait('@loadError');
    cy.get('.home-page__error').should('contain.text', 'Fehler beim Laden der Spiele.');
  });
});
