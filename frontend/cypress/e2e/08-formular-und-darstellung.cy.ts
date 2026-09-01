/// <reference types="cypress" />

/**
 * Formular- und Darstellungsdetails sind testenswert, weil Abbrechen und Bildfehler
 * typische Alltagssituationen sind und keine ungewollten Datenänderungen auslösen dürfen.
 */
describe('Formular und Darstellung', () => {
  const createdTitles: string[] = [];
  const uniqueSuffix = () => `${Date.now()}-${Cypress._.random(1000, 9999)}`;

  beforeEach(() => {
    cy.visitApp();
  });

  afterEach(() => {
    createdTitles.forEach((title) => cy.deleteGameByTitle(title));
    createdTitles.length = 0;
  });

  it('bricht das Bearbeiten ab und zeigt danach die Originaldaten unverändert an', () => {
    const suffix = uniqueSuffix();
    const originalTitle = `Cypress Original ${suffix}`;
    const originalDescription = `Originalbeschreibung ${suffix}`;
    const changedTitle = `Cypress Abgebrochen ${suffix}`;
    const changedDescription = `Geänderte Beschreibung ${suffix}`;
    createdTitles.push(originalTitle, changedTitle);

    cy.openAddGameForm();
    cy.fillGameForm({
      title: originalTitle,
      description: originalDescription,
      releaseDate: '2020-04-15',
    });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame').its('response.statusCode').should('eq', 201);

    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__description').should('contain.text', originalDescription);
      cy.get('.game-card__btn--edit').click();
    });

    cy.fillGameForm({ title: changedTitle, description: changedDescription });
    cy.get('.game-form__btn--cancel').click();

    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__title').should('contain.text', originalTitle);
      cy.get('.game-card__description').should('contain.text', originalDescription);
    });
    cy.contains('.game-card__title', changedTitle).should('not.exist');
    cy.contains('.game-card__description', changedDescription).should('not.exist');
  });

  it('zeigt bei einer kaputten Bild-URL den No-Image-Fallback ohne img-Element', () => {
    const title = `Cypress Kaputtes Bild ${uniqueSuffix()}`;
    createdTitles.push(title);

    cy.openAddGameForm();
    cy.fillGameForm({
      title,
      description: 'Dieses Spiel hat absichtlich ein defektes Cover.',
      imageUrl: 'http://localhost:3000/cover-das-nicht-existiert.jpg',
      releaseDate: '2021-08-20',
    });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame').its('response.statusCode').should('eq', 201);

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__image').should('exist');
      cy.get('.game-card__image').then(($img) => {
        ($img[0] as HTMLImageElement).dispatchEvent(new Event('error'));
      });
      cy.contains('.game-card__no-image', 'No Image').should('be.visible');
      cy.get('img').should('not.exist');
    });
  });

  it('zeigt ohne angegebene Bild-URL direkt den No-Image-Fallback', () => {
    const title = `Cypress Ohne Bild ${uniqueSuffix()}`;
    createdTitles.push(title);

    cy.openAddGameForm();
    cy.fillGameForm({
      title,
      description: 'Dieses Spiel wird ohne Cover angelegt.',
      releaseDate: '2022-01-12',
    });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame').its('response.statusCode').should('eq', 201);

    cy.contains('.game-card', title).within(() => {
      cy.contains('.game-card__no-image', 'No Image').should('be.visible');
      cy.get('img').should('not.exist');
    });
  });
});
