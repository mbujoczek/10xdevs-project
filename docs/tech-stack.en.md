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
- **Unit Testing:** xUnit.net
- **Mocking:** Moq

## Database

- **System:** SQL Server

## Artificial Intelligence (AI)

- **Solution:** Ollama for hosting open-source models (LLM).
- **Justification:**
  - Free (excluding infrastructure costs).
  - Data privacy.
  - Full control over the model.
- **Method:** Local API for sending prompts with a request for a JSON-formatted response.
- **Example Models:** Llama 3, Mistral, Phi-3.

## Testing

### Frontend

- **Unit and Component Tests:** Vitest
- **End-to-End (E2E) Tests:** Cypress

### Backend

- **Unit Tests:** xUnit.net (using the in-memory database provider for EF Core queries).
- **Mocking Library:** Moq.
