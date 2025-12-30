# AI Rules for 10xdevs-project

## FRONTEND

### Guidelines for VUE

#### VUE_CODING_STANDARDS

- Use the Composition API instead of the Options API for better type inference and code reuse
- Implement <script setup> for more concise component definitions
- Use Suspense and async components for handling loading states during code-splitting
- Leverage the defineProps and defineEmits macros for type-safe props and events
- Use the new defineOptions for additional component options
- Implement provide/inject for dependency injection instead of prop drilling in deeply nested components
- Use the Teleport component for portal-like functionality to render UI elsewhere in the DOM
- Leverage ref over reactive for primitive values to avoid unintended unwrapping
- Use v-memo for performance optimization in render-heavy list rendering scenarios
- Implement shallow refs for large objects that don't need deep reactivity

#### VUE_TECHNOLOGY_VERSIONS

- **Vue.js**: Use version ^3.4.0 or newer to leverage the latest features and performance improvements.
- **Vite**: Use version ^5.0.0 or newer as the project build tool.
- **Pinia**: Version ^2.1.0 or newer.
- **Vue Router**: Version ^4.3.0 or newer.
- **TypeScript**: Version ^5.4.0 or newer, configured in `strict` mode.

#### VUE_PATTERNS_AND_CONVENTIONS

- **State Management**: Use Pinia. Split stores into modules per functionality. Avoid storing data in stores that can be component local state.
- **API Communication**: Abstract API layer (in the `api/` directory) using `fetch` or `axios`. Each API module should be responsible for a single resource (e.g., `users.api.ts`).
- **Component Structure**:
  - Use `<script setup>` and Composition API.
  - Props should be thoroughly defined with `type`, `required`, and validator when necessary.
  - Emits should be defined using `defineEmits`.
- **Reusable Logic**: Extract shared logic between components into `composables` files.
- **Testing**: Write unit tests for composables, stores, and complex components using `Vitest`.

#### VUE_NAMING_CONVENTIONS

- **Components**:
  - File names: `PascalCase.vue` (e.g., `UserProfile.vue`).
  - Template names: `<PascalCase>` (e.g., `<UserProfile>`).
  - View-only components (without logic): `The<Name>.vue` (e.g., `TheHeader.vue`).
  - Base components (reusable): `Base<Name>.vue` (e.g., `BaseButton.vue`).
- **Composables**: `camelCase` with `use` prefix (e.g., `useAuth.ts`).
- **Store (Pinia)**: `camelCase` with `store` suffix (e.g., `auth.store.ts`, and inside `defineStore('authStore', ...)`).
- **Views (route components)**: `PascalCase` with `View.vue` suffix (e.g., `HomeView.vue`).
- **Routes (Vue Router)**: `camelCase` (e.g., `userProfile`).

#### VUE_DIRECTORY_STRUCTURE

The directory structure should be feature-based to ensure scalability and maintainability.

```
src/
├── api/                # API communication modules (e.g., auth.api.ts)
├── assets/             # Static assets (images, fonts)
├── components/
│   ├── base/           # Base components (e.g., BaseButton.vue)
│   └── common/         # Shared, complex components
├── composables/        # Reusable logic (e.g., useAuth.ts)
├── features/           # Main application modules
│   └── authentication/
│       ├── components/ # Module-specific components
│       ├── views/      # Module views (pages)
│       ├── store.ts    # Pinia store for the module
│       └── routes.ts   # Module route definitions
├── layouts/            # Page layouts (e.g., DefaultLayout.vue)
├── router/             # Vue Router configuration (index.ts)
├── services/           # Business logic (e.g., validation.service.ts)
├── store/              # Main Pinia configuration (index.ts)
├── styles/             # Global styles, SCSS variables
├── types/              # Global TypeScript type definitions
├── utils/              # Helper functions
├── App.vue             # Main application component
└── main.ts             # Application entry point
```

- **`api/`**: Data abstraction layer. Responsible **exclusively** for communication with external APIs. Defines functions for sending HTTP requests and transforming raw data (DTOs - Data Transfer Objects). Contains no business logic. Separates data fetching from data usage.

- **`assets/`**: Stores static files such as images (SVG, PNG), fonts, or global CSS files that are imported directly into the project.

- **`components/base/`**: Fundamental, atomic UI components such as `BaseButton.vue`, `BaseInput.vue`, `BaseCard.vue`. Highly reusable, contain no business logic, and are visually consistent throughout the application.

- **`components/common/`**: Complex components shared between different features but not generic enough for `base`. Example: `UserAvatarWithStatus.vue`, which may consist of several base components.

- **`composables/`**: Reusable, stateful logic extracted using the Composition API. Each file (e.g., `useAuth.ts`) exports a composable function that can be used in multiple components to share logic (e.g., authentication state management, mouse event handling).

- **`features/`**: Heart of the architecture. Each subdirectory is a separate business module of the application (e.g., `authentication`, `orders`). Groups all related files in one place, making project management and scaling easier.

  - **`components/`**: Components used **only** within the given feature. Example: `LoginForm.vue` in the `authentication` module won't be used elsewhere.
  - **`views/`**: Page components that are directly mapped to routes in the router. Example: `LoginView.vue` is rendered when the user navigates to the `/login` route.

- **`layouts/`**: Defines main page layouts (e.g., `DefaultLayout.vue` with navigation and footer, `AuthLayout.vue` for login pages). These components use `<slot>` to dynamically render view content provided by the router.

- **`router/`**: Contains Vue Router configuration. The `index.ts` file aggregates routes defined in individual `features` modules and configures global navigation guards.

- **`services/`**: Business logic layer. Services use functions from the `api/` directory to fetch data, then implement domain-specific logic (e.g., calculations, validations, data aggregation from multiple sources). They bridge raw data and its presentation in the user interface.

- **`store/`**: Main Pinia configuration. The `index.ts` file creates the Pinia instance. Individual store modules (e.g., `auth.store.ts`) are located in their respective `features` directories.

- **`styles/`**: Global styles, SCSS/SASS variables, mixins, and functions that should be available throughout the application.

- **`types/`**: Global TypeScript type and interface definitions shared across different parts of the application (e.g., `User`, `Product` types).

- **`utils/`**: Collection of small, stateless helper functions that perform simple, repetitive tasks (e.g., date formatting, string operations).

- **`App.vue`**: Main, root application component. Typically contains the `RouterView` component that renders the appropriate view based on the current route, and possibly global components like a notification system.

- **`main.ts`**: Application entry point. Here the Vue application instance is created, the main `App.vue` component is mounted, and plugins such as Vue Router and Pinia are registered.

#### PINIA

- Create multiple stores based on logical domains instead of a single large store
- Use the setup syntax (defineStore with setup function) for defining stores for better TypeScript inference
- Implement getters for derived state to avoid redundant computations
- Leverage the storeToRefs helper to extract reactive properties while maintaining reactivity
- Use plugins for cross-cutting concerns like persistence, state resets, or dev tools
- Implement actions for asynchronous operations and complex state mutations
- Use composable stores by importing and using stores within other stores
- Leverage the $reset() method to restore initial state when needed
- Implement $subscribe for reactive store subscriptions
- Use TypeScript with proper return type annotations for maximum type safety

#### VUE_ROUTER

- Use route guards (beforeEach, beforeEnter) for authentication and authorization checks
- Implement lazy loading with dynamic imports for route components to improve performance
- Use named routes instead of hardcoded paths for better maintainability
- Leverage route meta fields to store additional route information like permissions or layout data
- Implement scroll behavior options to control scrolling between route navigations
- Use navigation duplicates handling to prevent redundant navigation to the current route
- Implement the composition API useRouter and useRoute hooks instead of this.$router
- Use nested routes for complex UIs with parent-child relationships
- Leverage route params validation with sensitive: true for parameters that shouldn't be logged
- Implement dynamic route matching with path parameters and regex patterns for flexible routing

### Guidelines for STYLING

#### SCSS

- Use the ThemeProvider for consistent theming across components
- Implement the css helper for sharing styles between components
- Use props for conditional styling within template literals
- Leverage the createGlobalStyle for global styling
- Implement attrs method to pass HTML attributes to the underlying DOM elements
- Use the as prop for dynamic component rendering
- Leverage styled(Component) syntax for extending existing components
- Implement the css prop for one-off styling needs
- Use the & character for nesting selectors
- Leverage the keyframes helper for animations

## CODING_PRACTICES

### Guidelines for SUPPORT_LEVEL

#### SUPPORT_EXPERT

- Favor elegant, maintainable solutions over verbose code. Assume understanding of language idioms and design patterns.
- Highlight potential performance implications and optimization opportunities in suggested code.
- Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.
- Focus comments on 'why' not 'what' - assume code readability through well-named functions and variables.
- Keep code self-documenting through clear naming conventions instead of excessive comments
- Proactively address edge cases, race conditions, and security considerations without being prompted.
- When debugging, provide targeted diagnostic approaches rather than shotgun solutions.
- Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.

### Guidelines for DOCUMENTATION

#### SWAGGER

- Define comprehensive schemas for all request and response objects
- Use semantic versioning in API paths to maintain backward compatibility
- Implement detailed descriptions for endpoints, parameters, and {{domain_specific_concepts}}
- Configure security schemes to document authentication and authorization requirements
- Use tags to group related endpoints by resource or functional area
- Implement examples for all endpoints to facilitate easier integration by consumers

### Guidelines for STATIC_ANALYSIS

#### ESLINT

- Configure project-specific rules in eslint.config.js to enforce consistent coding standards
- Use shareable configs like eslint-config-airbnb or eslint-config-standard as a foundation
- Implement custom rules for {{project_specific_patterns}} to maintain codebase consistency
- Configure integration with Prettier to avoid rule conflicts for code formatting
- Use the --fix flag in CI/CD pipelines to automatically correct fixable issues
- Implement staged linting with husky and lint-staged to prevent committing non-compliant code

#### PRETTIER

- Define a consistent .prettierrc configuration across all {{project_repositories}}
- Configure editor integration to format on save for immediate feedback
- Use .prettierignore to exclude generated files, build artifacts, and {{specific_excluded_patterns}}
- Set printWidth based on team preferences (80-120 characters) to improve code readability
- Configure consistent quote style and semicolon usage to match team conventions
- Implement CI checks to ensure all committed code adheres to the defined style

## BACKEND

### Guidelines for DOTNET

#### ASP_NET

- Use minimal APIs for simple endpoints in .NET 6+ applications to reduce boilerplate code
- Implement the mediator pattern with MediatR for decoupling request handling and simplifying cross-cutting concerns
- Use API controllers with model binding and validation attributes for {{complex_data_models}}
- Apply proper response caching with cache profiles and ETags for improved performance on {{high_traffic_endpoints}}
- Implement proper exception handling with ExceptionFilter or middleware to provide consistent error responses
- Use dependency injection with scoped lifetime for request-specific services and singleton for stateless services

#### DOTNET_TECHNOLOGY_VERSIONS

- **.NET**: Use version ^8.0 or newer for the latest features and long-term support.
- **Entity Framework Core**: Version ^8.0 or newer.
- **MediatR**: Version ^12.0 or newer for implementing the CQRS pattern.
- **Swashbuckle (Swagger)**: Version ^6.5 or newer for API documentation.

#### DOTNET_CODING_STANDARDS

- Use nullable reference types enabled globally to prevent null reference exceptions
- Implement async/await for all I/O-bound operations to improve scalability
- Use record types for DTOs and value objects for immutability
- Leverage pattern matching and switch expressions for cleaner conditional logic
- Use init-only properties for immutable object initialization
- Implement proper cancellation token support in all async methods
- Use global using directives to reduce repetitive imports
- Leverage minimal APIs for simple CRUD endpoints
- Use source generators where applicable for performance optimization
- Implement primary constructors for cleaner dependency injection

#### DOTNET_PATTERNS_AND_CONVENTIONS

- **Architecture**: Implement CQRS (Command Query Responsibility Segregation) using MediatR to separate read and write operations.
- **API Structure**: Use controllers for complex endpoints with multiple actions. Use minimal APIs for simple CRUD operations.
- **Data Access**: Abstract data access using the Repository and Unit of Work patterns. Keep repositories focused on single entities.
- **Error Handling**: Implement global exception handling middleware. Return consistent error responses using ProblemDetails.
- **Dependency Injection**: Register services with appropriate lifetimes (Transient, Scoped, Singleton). Use constructor injection exclusively.
- **Configuration**: Use the Options pattern for strongly-typed configuration. Validate configuration at startup.
- **Logging**: Use structured logging with ILogger. Include correlation IDs for request tracking.

#### DOTNET_NAMING_CONVENTIONS

- **Projects**: `PascalCase` (e.g., `10xdevs.Api`, `10xdevs.Application`, `10xdevs.Infrastructure`).
- **Controllers**: `PascalCase` with `Controller` suffix (e.g., `UsersController`).
- **Commands**: `PascalCase` with descriptive action and `Command` suffix (e.g., `CreateUserCommand`, `UpdateUserCommand`).
- **Queries**: `PascalCase` with descriptive question and `Query` suffix (e.g., `GetUserByIdQuery`, `GetAllUsersQuery`).
- **Handlers**: `PascalCase` with `Handler` suffix matching the command/query (e.g., `CreateUserCommandHandler`).
- **Entities**: `PascalCase` singular form (e.g., `User`, `Order`).
- **DTOs**: `PascalCase` with `Dto` suffix (e.g., `UserDto`, `CreateUserDto`).
- **Repositories**: `I` prefix for interfaces, implementation without prefix (e.g., `IUserRepository`, `UserRepository`).
- **Services**: `I` prefix for interfaces with `Service` suffix (e.g., `IEmailService`, `EmailService`).
- **Endpoints**: Use plural resource names in lowercase (e.g., `/api/users`, `/api/orders`).

#### DOTNET_DIRECTORY_STRUCTURE

The directory structure follows Clean Architecture principles with clear separation of concerns.

```
solution-root/
└── src/
    ├── 10xdevs.Api/                   # Presentation layer (Web API)
    │   ├── Controllers/                # API controllers
    │   ├── Middleware/                 # Custom middleware
    │   ├── Filters/                    # Action filters
    │   ├── Extensions/                 # Service collection extensions
    │   ├── appsettings.json            # Configuration files
    │   └── Program.cs                  # Application entry point
    │
    ├── 10xdevs.Application/           # Application layer (CQRS)
    │   ├── Commands/                   # Command handlers
    │   │   └── Users/
    │   │       ├── CreateUser/
    │   │       │   ├── CreateUserCommand.cs
    │   │       │   └── CreateUserCommandHandler.cs
    │   │       └── UpdateUser/
    │   ├── Queries/                    # Query handlers
    │   │   └── Users/
    │   │       ├── GetUserById/
    │   │       │   ├── GetUserByIdQuery.cs
    │   │       │   └── GetUserByIdQueryHandler.cs
    │   │       └── GetAllUsers/
    │   ├── DTOs/                       # Data Transfer Objects
    │   ├── Interfaces/                 # Application interfaces
    │   ├── Behaviors/                  # MediatR pipeline behaviors
    │   ├── Mappings/                   # AutoMapper profiles
    │   └── Exceptions/                 # Custom exceptions
    │
    ├── 10xdevs.Domain/                # Domain layer
    │   ├── Entities/                   # Domain entities
    │   ├── ValueObjects/               # Value objects
    │   ├── Enums/                      # Enumerations
    │   ├── Interfaces/                 # Domain interfaces
    │   └── Exceptions/                 # Domain exceptions
    │
    └── 10xdevs.Infrastructure/        # Infrastructure layer
        ├── Data/                       # Database context and configurations
        │   ├── ApplicationDbContext.cs
        │   ├── Configurations/         # Entity configurations
        │   └── Migrations/             # EF Core migrations
        ├── Repositories/               # Repository implementations
        ├── Services/                   # External service implementations
        └── Extensions/                 # Infrastructure extensions
```

- **`10xdevs.Api/`**: Presentation layer containing API controllers, middleware, filters, and application configuration. Handles HTTP requests/responses and delegates business logic to the Application layer.

- **`10xdevs.Application/`**: Application logic layer implementing CQRS pattern with MediatR. Contains commands (write operations) and queries (read operations) with their handlers. Defines DTOs for data transfer and application-level interfaces.

  - **`Commands/`**: Write operations organized by feature. Each command has its handler in a dedicated folder.
  - **`Queries/`**: Read operations organized by feature. Each query has its handler in a dedicated folder.
  - **`Behaviors/`**: MediatR pipeline behaviors for cross-cutting concerns (logging, transactions).

- **`10xdevs.Domain/`**: Core domain layer containing business entities, value objects, domain logic, and domain events. Independent of external concerns and frameworks.

- **`10xdevs.Infrastructure/`**: Infrastructure layer implementing interfaces defined in Application and Domain layers. Contains database context, repository implementations, external service integrations, and EF Core configurations.

  - **`Data/Configurations/`**: Fluent API configurations for entity mappings.
  - **`Repositories/`**: Concrete implementations of repository interfaces.

#### ENTITY_FRAMEWORK

- Use the repository and unit of work patterns to abstract data access logic
- Implement eager loading with Include() to avoid N+1 query problems for {{entity_relationships}}
- Use migrations for database schema changes and version control with proper naming conventions
- Apply appropriate tracking behavior (AsNoTracking() for read-only queries) to optimize performance
- Implement query optimization techniques like compiled queries for frequently executed database operations
- Use value conversions for complex property transformations and proper handling of {{custom_data_types}}

#### CQRS_MEDIATR

- Organize commands and queries in separate folders by feature/entity for better maintainability
- Keep command and query handlers focused on a single responsibility
- Use the request/response pattern - each command/query should have a clear return type
- Use pipeline behaviors for cross-cutting concerns like logging and transaction management
- Commands should return operation results or unit, not domain entities directly
- Queries should return DTOs, never domain entities, to prevent accidental modifications
- Place each command/query with its handler in the same folder
- Use cancellation tokens in all handlers to support request cancellation
- Keep handlers thin by delegating to domain services or repositories

## DATABASE

### Guidelines for SQL

#### SQLSERVER

- Use parameterized queries to prevent SQL injection
- Implement proper indexing strategies based on query patterns
- Use stored procedures for complex business logic that requires database access to {{business_entities}}

## TESTING

### Guidelines for UNIT

#### VITEST

- Leverage the `vi` object for test doubles - Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, and `vi.stubGlobal()` for global mocks. Prefer spies over mocks when you only need to verify interactions without changing behavior.
- Master `vi.mock()` factory patterns - Place mock factory functions at the top level of your test file, return typed mock implementations, and use `mockImplementation()` or `mockReturnValue()` for dynamic control during tests. Remember the factory runs before imports are processed.
- Create setup files for reusable configuration - Define global mocks, custom matchers, and environment setup in dedicated files referenced in your `vitest.config.ts`. This keeps your test files clean while ensuring consistent test environments.
- Use inline snapshots for readable assertions - Replace complex equality checks with `expect(value).toMatchInlineSnapshot()` to capture expected output directly in your test file, making changes more visible in code reviews.
- Monitor coverage with purpose and only when asked - Configure coverage thresholds in `vitest.config.ts` to ensure critical code paths are tested, but focus on meaningful tests rather than arbitrary coverage percentages.
- Make watch mode part of your workflow - Run `vitest --watch` during development for instant feedback as you modify code, filtering tests with `-t` to focus on specific areas under development.
- Explore UI mode for complex test suites - Use `vitest --ui` to visually navigate large test suites, inspect test results, and debug failures more efficiently during development.
- Handle optional dependencies with smart mocking - Use conditional mocking to test code with optional dependencies by implementing `vi.mock()` with the factory pattern for modules that might not be available in all environments.
- Configure jsdom for DOM testing - Set `environment: 'jsdom'` in your configuration for frontend component tests and combine with testing-library utilities for realistic user interaction simulation.
- Structure tests for maintainability - Group related tests with descriptive `describe` blocks, use explicit assertion messages, and follow the Arrange-Act-Assert pattern to make tests self-documenting.
- Leverage TypeScript type checking in tests - Enable strict typing in your tests to catch type errors early, use `expectTypeOf()` for type-level assertions, and ensure mocks preserve the original type signatures.

### Guidelines for E2E

#### CYPRESS

- Use component testing for testing components in isolation
- Implement E2E testing for critical user flows
- Use cy.intercept() for network request mocking and stubbing
- Leverage custom commands for reusable test steps
- Implement fixtures for test data
- Use data-\* attributes for test selectors instead of CSS classes or IDs
- Leverage the Testing Library integration for better queries
- Implement retry-ability for flaky tests
- Use the Cypress Dashboard for CI integration and test analytics
- Leverage visual testing for UI regression testing

## DEVOPS

### Guidelines for CI_CD

#### GITHUB_ACTIONS

- Check if `package.json` exists in project root and summarize key scripts
- Check if `.nvmrc` exists in project root
- Check if `.env.example` exists in project root to identify key `env:` variables
- Always use terminal command: `git branch -a | cat` to verify whether we use `main` or `master` branch
- Always use `env:` variables and secrets attached to jobs instead of global workflows
- Always use `npm ci` for Node-based dependency setup
- Extract common steps into composite actions in separate files
- Once you're done, as a final step conduct the following: for each public action always use <tool>"Run Terminal"</tool> to see what is the most up-to-date version (use only major version) - extract tag_name from the response:
- `bash curl -s https://api.github.com/repos/{owner}/{repo}/releases/latest `

### Guidelines for CONTAINERIZATION

#### DOCKER

- Use multi-stage builds to create smaller production images
- Implement layer caching strategies to speed up builds for {{dependency_types}}
- Use non-root users in containers for better security
