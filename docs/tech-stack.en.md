# Tech Stack

## Frontend

- **Framework:** Vue 3 (with Composition API)
- **Language:** TypeScript
- **UI Library:** Vuetify
- **State Management:** Pinia
- **Routing:** Vue Router
- **Styling:** SCSS and Vuetify classes
- **Tooling:** ESLint and Prettier

## Backend

- **Platform:** .NET
- **Data Access (ORM):** Entity Framework
- **Architectural Pattern:** CQRS (Command Query Responsibility Segregation)
- **API Documentation:** Swagger (OpenAPI)

## Database

- **System:** SQL Server

## Artificial Intelligence (AI)

- **Solution:** OpenRouter - Cloud-based API for accessing various LLM models.
- **Justification:**
  - Access to multiple state-of-the-art models.
  - No local infrastructure required.
  - Pay-per-use pricing model.
  - Reliable availability and performance.
- **Method:** REST API for sending prompts with structured JSON response format using JSON Schema.
- **Default Model:** Mistral 7B Instruct (cost-effective and reliable for instruction following).

## Testing

### Frontend

- **Unit and Component Tests:** Vitest
- **End-to-End (E2E) Tests:** Cypress

### Backend

- **Unit Tests:** xUnit
- **Assertion Library:** FluentAssertions
- **Mocking Library:** NSubstitute
