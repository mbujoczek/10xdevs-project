/// <reference types="cypress" />

import '@testing-library/cypress/add-commands'

Cypress.Commands.add('login', (username?: string, password?: string) => {
  const user = username ?? Cypress.env('USERNAME')
  const pass = password ?? Cypress.env('PASSWORD')

  cy.session([user, pass], () => {
    cy.visit('/login')
    cy.get('input[type="text"]').type(user)
    cy.get('input[type="password"]').type(pass)
    cy.contains('button', 'Log In').click()

    // Wait for redirect to dashboard
    cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 20000 })

    // Verify token is stored
    cy.window().then((win) => {
      const authToken = win.localStorage.getItem('authToken')
      expect(authToken).to.exist
    })
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<void>
    }
  }
}
