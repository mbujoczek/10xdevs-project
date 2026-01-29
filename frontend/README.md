# AI Flashcard Generator - Frontend

This template helps you get started developing with Vue 3 and Vite. It's configured to follow the best practices and conventions outlined in the project's AI guidelines.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- **Chromium-based browsers** (Chrome, Edge, Brave):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- **Firefox**:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## Project Structure

The directory structure is feature-based to ensure scalability and maintainability.

```
src/
├── api/                # API communication modules
├── assets/             # Static assets (images, fonts)
├── components/
│   ├── base/           # Base, reusable UI components
│   └── common/         # Shared, complex components
├── composables/        # Reusable logic (Composition API)
├── features/           # Main application modules (e.g., authentication)
├── layouts/            # Page layouts
├── router/             # Vue Router configuration
├── store/              # Pinia state management stores
├── styles/             # Global styles and variables
├── types/              # Global TypeScript type definitions
├── utils/              # Helper functions
├── App.vue             # Main application component
└── main.ts             # Application entry point
```

## Architecture

The project follows a scalable, feature-based architecture:

- **`features/`**: Core application modules. Each feature is self-contained with its own components, views, routes, and store.
- **`components/`**: `base/` components are for atomic, reusable UI elements, while `common/` holds more complex shared components.
- **`composables/`**: Reusable stateful logic extracted with the Composition API.
- **`api/`**: The `api/` layer handles raw HTTP communication.
- **State Management & Business Logic**: Handled by [Pinia](https://pinia.vuejs.org/). Stores contain state and business logic, orchestrating calls to the `api` layer. They are located within their respective feature modules.

## Technology Stack

- **Vue.js**: ^3.4.0
- **Vite**: ^5.0.0
- **Pinia**: ^2.1.0
- **Vue Router**: ^4.3.0
- **TypeScript**: ^5.4.0
- **ESLint**: For code linting
- **Vitest**: For unit testing
- **Cypress**: For end-to-end testing

## Project Setup

### Install Dependencies

```sh
npm install
```

### Configure Environment Variables

Create a `.env` file in the frontend root directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5019/api

# Cypress E2E Test Credentials
# These credentials are used by automated tests
# Make sure to create a user with these credentials in your application
CYPRESS_USERNAME=cypress-username
CYPRESS_PASSWORD=cypress-password
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Development Guidelines

- **Components**: Create new components in `src/components/base` (simple, reusable), `src/components/common` (complex, shared), or `src/features/{feature}/components` (feature-specific).
- **Logic**: Extract reusable logic into `src/composables`.
- **State**: Define Pinia stores in `src/features/{feature}/store.ts`.
- **API Calls**: Add new API communication functions in `src/api`.
- **Business Logic & State**: Implement business rules, data processing, and state management in Pinia stores (`src/features/{feature}/store.ts`).
