describe('Register Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/register')
  })

  it('displays registration form with all elements', () => {
    cy.contains('Register').should('be.visible')
    cy.get('input[type="text"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.contains('button', 'Sign up').should('be.visible')
    cy.contains('a', 'Log In').should('be.visible')
  })

  it('submit button is disabled when form is empty', () => {
    cy.contains('button', 'Sign up').should('be.disabled')
  })

  it('submit button is disabled when only username is filled', () => {
    cy.get('input[type="text"]').type('testuser')
    cy.contains('button', 'Sign up').should('be.disabled')
  })

  it('submit button is disabled when password is too short', () => {
    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('pass')
    cy.contains('button', 'Sign up').should('be.disabled')
  })

  it('submit button is disabled when username contains spaces', () => {
    cy.get('input[type="text"]').type('test user')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').should('be.disabled')
  })

  it('submit button is disabled when username exceeds 50 characters', () => {
    cy.get('input[type="text"]').type('a'.repeat(51))
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').should('be.disabled')
  })

  it('submit button is enabled when all fields are valid', () => {
    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').should('not.be.disabled')
  })

  it('successfully registers with valid credentials', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        id: 1,
        username: 'testuser',
        token: 'mock-jwt-token-123',
        createdAtUtc: '2026-01-03T10:00:00Z',
      },
    }).as('registerRequest')

    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').click()

    cy.wait('@registerRequest')
    cy.url().should('eq', Cypress.config().baseUrl + '/')

    cy.window().then((win) => {
      const authToken = win.localStorage.getItem('authToken')
      expect(authToken).to.equal('mock-jwt-token-123')
    })

    cy.window().its('localStorage').invoke('getItem', 'authUser').should('not.be.null')
  })

  it('displays validation error for password too short', () => {
    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('pass')
    cy.get('input[type="password"]').blur()

    cy.contains('Password must be at least 8 characters long').should('be.visible')
  })

  it('displays validation error for username with spaces', () => {
    cy.get('input[type="text"]').type('test user')
    cy.get('input[type="text"]').blur()

    cy.contains('Username cannot contain spaces').should('be.visible')
  })

  it('displays validation error for username too long', () => {
    cy.get('input[type="text"]').type('a'.repeat(51))
    cy.get('input[type="text"]').blur()

    cy.contains('Username must not exceed 50 characters').should('be.visible')
  })

  it('displays error toast on username conflict (409)', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 409,
      body: {
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
        title: 'Username Already Exists',
        status: 409,
        detail: "A user with the username 'testuser' already exists.",
      },
    }).as('registerRequest')

    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').click()

    cy.wait('@registerRequest')
    cy.contains('This username is already taken. Please choose another one.').should('be.visible')
    cy.url().should('include', '/register')
  })

  it('displays error toast on validation error (400)', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 400,
      body: {
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          password: ['Password must be at least 8 characters long'],
        },
      },
    }).as('registerRequest')

    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').click()

    cy.wait('@registerRequest')
    cy.contains('Password must be at least 8 characters long').should('be.visible')
    cy.url().should('include', '/register')
  })

  it('displays error toast on server error (500)', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 500,
      body: {
        type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
      },
    }).as('registerRequest')

    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').click()

    cy.wait('@registerRequest')
    cy.contains('An unexpected server error occurred. Please try again later.').should('be.visible')
    cy.url().should('include', '/register')
  })

  it('shows loading state during registration', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      delay: 1000,
      body: {
        id: 1,
        username: 'testuser',
        token: 'mock-jwt-token-123',
        createdAtUtc: '2026-01-03T10:00:00Z',
      },
    }).as('registerRequest')

    cy.get('input[type="text"]').type('testuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').click()

    cy.get('.v-overlay').should('be.visible')
    cy.get('.v-progress-circular').should('be.visible')
  })

  it('navigates to login page when clicking login link', () => {
    cy.contains('a', 'Log In').click()
    cy.url().should('include', '/login')
  })

  it('redirects authenticated users to home page', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'existing-token')
      win.localStorage.setItem('authUser', JSON.stringify({ id: 1, username: 'testuser' }))
    })

    cy.visit('/register')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('displays validation error when username contains spaces', () => {
    cy.get('input[type="text"]').type('test user')
    cy.get('input[type="text"]').blur()

    cy.contains('Username cannot contain spaces').should('be.visible')
    cy.contains('button', 'Sign up').should('be.disabled')
  })

  it('automatically logs in after successful registration', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        id: 1,
        username: 'newuser',
        token: 'new-user-token-456',
        createdAtUtc: '2026-01-03T10:00:00Z',
      },
    }).as('registerRequest')

    cy.get('input[type="text"]').type('newuser')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign up').click()

    cy.wait('@registerRequest')
    cy.url().should('eq', Cypress.config().baseUrl + '/')

    cy.window().then((win) => {
      const authToken = win.localStorage.getItem('authToken')
      const authUser = win.localStorage.getItem('authUser')

      expect(authToken).to.equal('new-user-token-456')
      expect(JSON.parse(authUser!)).to.deep.equal({ id: 1, username: 'newuser' })
    })
  })

  it('displays "Already have an account?" text', () => {
    cy.contains('Already have an account?').should('be.visible')
  })

  it('has proper form layout and styling', () => {
    cy.get('.v-card').should('be.visible')
    cy.get('.v-card').should('have.css', 'width', '400px')
  })
})
