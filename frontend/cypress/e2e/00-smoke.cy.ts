/// <reference types="cypress" />

describe('Smoke Test', () => {
  it('lädt die Startseite und das Backend', () => {
    cy.request('GET', '/api/games').its('status').should('eq', 200);

    cy.visit('/');
    cy.get('.home-page__headline').should('contain.text', 'Games Library');
  });
});
