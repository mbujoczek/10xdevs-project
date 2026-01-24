# CI/CD and Containerization Implementation Plan

## 1. Introduction and Goals

This document outlines the strategy for implementing a CI/CD pipeline using GitHub Actions and containerizing the application with Docker. The primary goals are:

- **Automation**: Automate the testing, building, and deployment processes.
- **Consistency**: Ensure a consistent and reproducible environment for both local development and production using Docker.
- **Security**: Securely manage secrets like API keys and database passwords.
- **Reliability**: Create a structured and reliable workflow for releasing new versions of the application.

The strategy is based on a Git flow where feature branches are merged into `develop`, and `develop` is periodically merged into `main` to create a production release.

## 2. Containerization Strategy

The application will be split into three main containerized services orchestrated by Docker Compose for local development: `frontend`, `backend`, and `db`.

### 2.1. File Structure

```
/
├── backend/
│   └── Dockerfile              # Dockerfile for the .NET backend
├── frontend/
│   └── Dockerfile              # Dockerfile for the Vue.js frontend
├── .dockerignore               # Excludes unnecessary files from build context
├── docker-compose.yml          # Orchestrates all services for local development
├── .env                        # Local secrets (Git-ignored)
└── .env.example                # Template for required secrets
```

### 2.2. Backend Dockerfile (`/backend/Dockerfile`)

A multi-stage build will be used to create a small, optimized production image.

- **Build Stage**: Uses the `.NET SDK` image to restore dependencies, build, and publish the application. The build context will be the `/backend` directory.
- **Final Stage**: Uses the lightweight `.NET ASP.NET Runtime` image and copies only the published artifacts from the build stage.

### 2.3. Frontend Dockerfile (`/frontend/Dockerfile`)

A multi-stage build will be used here as well.

- **Build Stage**: Uses a `node` image to install dependencies (`npm ci`) and build the Vue.js application (`npm run build`).
- **Final Stage**: Uses a lightweight `nginx` image. The built static files from the `dist` directory are copied over. A custom `nginx.conf` will be added to correctly serve the Single Page Application (SPA) and act as a reverse proxy for the backend API to avoid CORS issues in the local environment.

### 2.4. Database Service (`db`)

- **Image**: `mcr.microsoft.com/mssql/server:2022-latest`.
- **Configuration**: The service will be configured in `docker-compose.yml`.
- **Data Persistence**: A named Docker volume (e.g., `db-data`) will be used to persist database data across container restarts.
- **Dependencies**: The `backend` service will be configured with `depends_on` to ensure the database is started first.

### 2.5. Configuration and Secret Management (Local)

A clear distinction will be made between configuration (non-sensitive, environment-specific values) and secrets (sensitive credentials).

- **Centralized Configuration**: The `docker-compose.yml` file will become the single source of truth for environment configuration when running locally. All variables from `appsettings.json` and `frontend/.env` (like database names, issuers, or API URLs) will be defined there. This centralizes setup and makes it easy to see the entire environment's configuration at a glance.

- **Local Secrets (`.env` file)**: All secrets required for local development (e.g., `OPENROUTER_API_KEY`, `DB_SA_PASSWORD`, `JWT_SECRET_KEY`) will be stored in a `.env` file in the project root.
  - **`.gitignore`**: This `.env` file will be added to `.gitignore` to prevent it from ever being committed to the repository.
  - **`docker-compose.yml`**: The compose file will automatically read secrets from the `.env` file and pass them as environment variables to the appropriate containers. .NET configuration binding (e.g., `Jwt__SecretKey=${JWT_SECRET_KEY}`) will be used to map these variables to `appsettings.json` structures.
  - **`.env.example`**: A template file will be committed to the repository to show other developers which environment variables are required, without exposing any sensitive values.

## 3. CI/CD Strategy with GitHub Actions

The CI/CD process will be managed by three main workflows and two composite actions.

### 3.1. File Structure

```
.github/
├── actions/
│   ├── backend-build-test/
│   │   └── action.yml      # Composite action for backend CI steps
│   └── frontend-build-test/
│       └── action.yml      # Composite action for frontend CI steps
└── workflows/
    ├── pr-checks.yml           # Runs on PRs to develop and main
    ├── release-drafter.yml     # Drafts releases on pushes to main
    └── deploy-production.yml   # Deploys to production on release publication
```

### 3.2. Composite Actions (`.github/actions/`)

- **`backend-build-test`**: A reusable action that sets up .NET, restores dependencies, builds the solution, and runs xUnit tests.
- **`frontend-build-test`**: A reusable action that sets up Node.js, installs dependencies (`npm ci`), lints the code, and runs Vitest unit tests.

### 3.3. Workflows (`.github/workflows/`)

- **`pr-checks.yml`**:
  - **Trigger**: `pull_request` to `develop` and `main` branches.
  - **Purpose**: To ensure code quality and prevent merging broken code. It will run both the `backend-build-test` and `frontend-build-test` composite actions.

- **`release-drafter.yml`**:
  - **Trigger**: `push` to the `main` branch.
  - **Purpose**: To automate the creation of release notes. It uses the `release-drafter/release-drafter` action to create a draft release, aggregating all changes since the last release. This facilitates the manual process of publishing a new version.

- **`deploy-production.yml`**:
  - **Trigger**: `release` with type `published`.
  - **Purpose**: To automate deployment to the production environment.
  - **Steps**:
    1. Define the job to run in the `production` environment.
    2. Check out the code corresponding to the release tag.
    3. Build and push Docker images for the frontend and backend to a container registry (e.g., GitHub Container Registry, Docker Hub, Azure Container Registry).
    4. Trigger the deployment on the production infrastructure (e.g., using `ssh` to run `docker-compose pull && docker-compose up -d` on a VPS, or using specific actions for cloud providers like Azure or AWS).

  **Note on Database Migrations**: EF Core migrations will be applied automatically when the backend application starts. This is configured in the application startup code to run `context.Database.Migrate()` before accepting requests.

### 3.4. Secret Management (CI/CD)

- **GitHub Environments**: A "production" environment will be configured in the repository settings.
- **GitHub Secrets**: All production secrets (`OPENROUTER_API_KEY`, `DB_SA_PASSWORD`, container registry credentials, etc.) will be stored as encrypted secrets within the "production" environment.
- **Workflow Access**: The `deploy-production.yml` workflow will be configured to use the `production` environment, giving it secure access to the necessary secrets. This ensures that secrets are only exposed to the deployment job and not to other workflows.
