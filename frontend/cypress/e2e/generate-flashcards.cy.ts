/// <reference types="@testing-library/cypress" />

describe('Generate Flashcards Flow', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should complete full flashcard generation flow from dashboard to flashcards list', () => {
    // Step 1: Start from Dashboard and click "Generate flashcards"
    cy.visit('/')
    cy.findByRole('button', { name: /generate flashcards/i }).should('be.visible')
    cy.findByRole('button', { name: /generate flashcards/i }).click()

    // Step 2: Fill form on Generate page and submit
    cy.url().should('include', '/generate')
    cy.findByRole('heading', { name: /generate flashcards/i }).should('be.visible')

    // Find textarea and fill with text
    cy.findByRole('textbox', { name: /study material/i }).should('be.visible')
    cy.fixture('studyMaterial').then((data) => {
      cy.findByRole('textbox', { name: /study material/i }).type(data.content, { delay: 0 })
    })

    // Click generate
    cy.intercept('POST', '/api/flashcards/generate').as('generateFlashcards')
    cy.findByRole('button', { name: /generate flashcards/i }).click()
    cy.wait('@generateFlashcards')

    // Step 3: Wait for redirect to Review page and verify cards are loaded
    cy.url().should('match', /\/review\/\d+$/)
    cy.findByRole('heading', { name: /review generated flashcards/i }).should('be.visible')

    // Verify initial stats show all pending
    cy.contains('.text-caption', /pending/i)
      .parent()
      .find('.text-h4')
      .should('not.contain', '0')
    cy.contains('.text-caption', /accepted/i)
      .parent()
      .find('.text-h4')
      .should('contain', '0')
    cy.contains('.text-caption', /edited/i)
      .parent()
      .find('.text-h4')
      .should('contain', '0')
    cy.contains('.text-caption', /rejected/i)
      .parent()
      .find('.text-h4')
      .should('contain', '0')

    // Step 4: Accept all cards one by one using chained promises
    cy.findAllByRole('button', { name: /^accept$/i }).then(($buttons: JQuery<HTMLElement>) => {
      const count = $buttons.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Array.from({ length: count }).reduce((chain: Cypress.Chainable<any>, _, i) => {
        return chain.then(() => {
          // Click the button at the current index
          cy.findAllByRole('button', { name: /^accept$/i })
            .eq(i)
            .click()

          // Confirm dialog should appear
          cy.findByRole('heading', { name: /confirm action/i }).should('be.visible')
          cy.findByText(/are you sure you want to accept this flashcard/i).should('be.visible')

          // Click Confirm button in dialog
          cy.findByRole('button', { name: /^confirm$/i }).click()

          // Wait for dialog to close
          cy.findByRole('heading', { name: /confirm action/i }).should('not.exist')
        })
      }, cy.wrap(null))
    })

    // Step 5: Verify all cards accepted, 0 pending
    cy.contains('.text-caption', /pending/i)
      .parent()
      .find('.text-h4')
      .should('contain', '0')
    cy.contains('.text-caption', /accepted/i)
      .parent()
      .find('.text-h4')
      .should('not.contain', '0')

    // Verify Finish review button is enabled
    cy.findByRole('button', { name: /finish review/i }).should('not.be.disabled')

    // Step 6: Click Finish review
    cy.findByRole('button', { name: /finish review/i }).click()

    // Step 7: Verify we're redirected to Flashcards page
    cy.url().should('include', '/flashcards', { timeout: 10000 })
    cy.findByRole('heading', { name: /my flashcards/i }).should('be.visible')
  })

  it('should handle mixed actions (accept, edit, reject)', () => {
    // Setup: Navigate to generate page
    cy.visit('/')
    cy.get('.v-overlay__scrim').should('not.be.visible')
    cy.findByRole('button', { name: /generate flashcards/i }).click()

    cy.url().should('include', '/generate')

    // Fill form with less text for faster generation
    cy.fixture('studyMaterial').then((data) => {
      const shortText = data.content.substring(0, 250)
      cy.findByRole('textbox', { name: /study material/i }).type(shortText, { delay: 0 })
    })

    // Submit and wait for review page
    cy.intercept('POST', '/api/flashcards/generate').as('generateFlashcards')
    cy.findByRole('button', { name: /generate flashcards/i }).click()
    cy.wait('@generateFlashcards')

    cy.url().should('match', /\/review\/\d+$/)

    // Accept first card
    cy.findAllByRole('button', { name: /^accept$/i })
      .first()
      .click()
    cy.findByRole('button', { name: /^confirm$/i }).click()

    // Edit second card (if exists)
    cy.findAllByRole('button', { name: /^edit$/i })
      .eq(1)
      .then(($btn: JQuery<HTMLElement>) => {
        if ($btn.length > 0) {
          cy.wrap($btn).first().click()

          // Edit dialog should appear
          cy.findByRole('heading', { name: /edit flashcard/i }).should('be.visible')

          // Modify question and answer
          cy.findByLabelText(/question/i).clear()
          cy.findByLabelText(/question/i).type('Modified Question E2E')
          cy.findByLabelText(/answer/i).clear()
          cy.findByLabelText(/answer/i).type('Modified Answer E2E')

          // Wait for save button to be enabled
          cy.findByRole('button', { name: /^save$/i }).should('be.enabled')
          // Save changes
          cy.findByRole('button', { name: /^save$/i }).click()

          // Confirm the edit
          cy.findByRole('button', { name: /^confirm$/i }).click()
        }
      })

    // Reject third card (if exists)
    cy.findAllByRole('button', { name: /^reject$/i })
      .eq(2)
      .then(($btn: JQuery<HTMLElement>) => {
        if ($btn.length > 0) {
          cy.wrap($btn).first().click()
          cy.findByRole('button', { name: /^confirm$/i }).click()
        }
      })

    // Accept all remaining pending cards
    cy.get('body').then(() => {
      const acceptAll = () => {
        cy.findAllByRole('button', { name: /^accept$/i }).then(($buttons: JQuery<HTMLElement>) => {
          const enabledButtons = $buttons.filter(':not([disabled])')
          if (enabledButtons.length > 0) {
            cy.wrap(enabledButtons).first().click()
            cy.findByRole('button', { name: /^confirm$/i }).click()
            acceptAll()
          }
        })
      }
      acceptAll()
    })

    // Verify no pending cards
    cy.contains('.text-caption', /pending/i)
      .parent()
      .find('.text-h4')
      .should('contain', '0')

    // Complete review
    cy.findByRole('button', { name: /finish review/i }).click()
    cy.url().should('include', '/flashcards', { timeout: 10000 })
  })

  it('should prevent finishing review when cards are still pending', () => {
    cy.visit('/')
    cy.findByRole('button', { name: /generate flashcards/i }).click()

    cy.fixture('studyMaterial').then((data) => {
      const shortText = data.content.substring(0, 150)
      cy.findByRole('textbox', { name: /study material/i }).type(shortText, { delay: 0 })
    })

    cy.intercept('POST', '/api/flashcards/generate').as('generateFlashcards')
    cy.findByRole('button', { name: /generate flashcards/i }).click()
    cy.wait('@generateFlashcards')

    cy.url().should('match', /\/review\/\d+$/)

    // Finish button should be disabled when cards are pending
    cy.findByRole('button', { name: /finish review/i }).should('be.disabled')
  })

  it('should validate minimum text length before allowing generation', () => {
    cy.visit('/generate')

    // Try with text too short (< 50 characters)
    cy.findByRole('textbox', { name: /study material/i }).type('This is too short')

    // Generate button should be disabled
    cy.findByRole('button', { name: /generate flashcards/i }).should('be.disabled')

    // Add more text to meet minimum requirement
    cy.findByRole('textbox', { name: /study material/i }).type(
      ' and now we add enough text to meet the minimum requirement of 50 characters',
    )

    // Generate button should be enabled
    cy.findByRole('button', { name: /generate flashcards/i }).should('not.be.disabled')
  })
})
