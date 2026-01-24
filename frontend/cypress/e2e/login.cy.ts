describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/login')
  })

  it('displays login form with all elements', () => {
    cy.contains('Log In').should('be.visible')
    cy.get('input[type="text"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.contains('button', 'Log In').should('be.visible')
    cy.contains('a', 'Register').should('be.visible')
  })

  it('submit button is disabled when form is empty', () => {
    cy.contains('button', 'Log In').should('be.disabled')
  })

  it('submit button is disabled when only username is filled', () => {
    cy.get('input[type="text"]').type('testuser')
    cy.contains('button', 'Log In').should('be.disabled')
  })

  it('submit button is enabled when both fields are filled', () => {
    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Log In').should('not.be.disabled')
  })

  it('successfully logs in with valid credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        id: 1,
        username: 'testuser',
        token: 'mock-jwt-token-123',
        expiresAt: '2026-01-03T00:00:00Z',
      },
    }).as('loginRequest')

    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Log In').click()

    cy.wait('@loginRequest')
    cy.url().should('eq', Cypress.config().baseUrl + '/')

    cy.window().then((win) => {
      const authToken = win.localStorage.getItem('authToken')
      expect(authToken).to.equal('mock-jwt-token-123')
    })

    cy.window().its('localStorage').invoke('getItem', 'authUser').should('not.be.null')
  })

  it('displays error toast on invalid credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        type: 'https://tools.ietf.org/html/rfc7235#section-3.1',
        title: 'Invalid Credentials',
        status: 401,
        detail: 'Username or password is incorrect.',
      },
    }).as('loginRequest')

    cy.get('input[type="text"]').type('wronguser')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.contains('button', 'Log In').click()

    cy.wait('@loginRequest')
    cy.contains('Username or password is incorrect').should('be.visible')
    cy.url().should('include', '/login')
  })

  it('displays error toast on server error', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 500,
      body: {
        type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
      },
    }).as('loginRequest')

    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Log In').click()

    cy.wait('@loginRequest')
    cy.contains('An unexpected server error occurred').should('be.visible')
    cy.url().should('include', '/login')
  })

  it('shows loading state during login', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      delay: 1000,
      body: {
        id: 1,
        username: 'testuser',
        token: 'mock-jwt-token-123',
        expiresAt: '2026-01-03T00:00:00Z',
      },
    }).as('loginRequest')

    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Log In').click()

    cy.get('.v-overlay').should('be.visible')
    cy.get('.v-progress-circular').should('be.visible')
  })

  it('navigates to register page when clicking register link', () => {
    cy.contains('a', 'Register').click()
    cy.url().should('include', '/register')
  })

  it('redirects authenticated users to dashboard', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'existing-token')
      win.localStorage.setItem('authUser', JSON.stringify({ id: 1, username: 'testuser' }))
    })

    cy.visit('/login')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('trims whitespace from username', () => {
    cy.intercept('POST', '/api/auth/login', (req) => {
      expect(req.body.username).to.equal('testuser')
      req.reply({
        statusCode: 200,
        body: {
          id: 1,
          username: 'testuser',
          token: 'mock-jwt-token-123',
          expiresAt: '2026-01-03T00:00:00Z',
        },
      })
    }).as('loginRequest')

    cy.get('input[type="text"]').type('  testuser  ')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Log In').click()

    cy.wait('@loginRequest')
  })
})
