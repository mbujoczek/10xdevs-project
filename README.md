# AI Flashcard Generator

[![Project Status: Active](https://img.shields.io/badge/status-active-success.svg)](https://github.com/mbujoczek/10xdevs-project)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An AI-powered web application designed to streamline the learning process by automatically generating flashcards from user-provided text.

## Table of Contents

- [About This Project](#about-this-project)
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Project Scope](#project-scope)
- [Project Status](#project-status)

## About This Project

This project is being developed as part of the **[10xdevs.pl](https://www.10xdevs.pl/)** course, the goal of which is to learn how to consciously use the latest AI models and tools at every stage of project development—from requirements analysis and rapid MVP creation to careful implementation of business logic, agile production deployment, legacy code refactoring, and test and CI/CD automation.

### AI Models in Use

Throughout the development of this project, a multi-agent approach is utilized, leveraging different AI models for specific tasks:

- **Architect & Planner (Gemini 2.5 Pro):** Responsible for high-level planning, architectural decisions, and documentation generation.
- **Coding Assistant (Claude Sonnet 4.5):** Assists with generating code, writing tests, and implementing features.
- **Problem Solver (Grok Code Fast 1):** Delegated to handle and resolve low-complexity issues and tasks.

## Project Description

The AI Flashcard Generator helps students and learners save time by automating the creation of study materials. Users can paste text from notes or articles, and the application's AI will generate a list of suggested flashcards (question-answer pairs). These cards can then be reviewed, edited, or accepted before being added to the user's collection for studying with an integrated Spaced Repetition System (SRS).

The project is divided into two main parts:

- **[Frontend](./frontend/README.md)**: A Vue.js single-page application.
- **[Backend](./backend/README.md)**: A .NET-based REST API.

For detailed information about each part, please refer to their respective `README.md` files.

## Tech Stack

The project leverages a modern technology stack for both frontend and backend development.

| Category     | Technology                                                            |
| ------------ | --------------------------------------------------------------------- |
| **Frontend** | Vue 3 (Composition API), TypeScript, Vite, Pinia, Vue Router, Vuetify |
| **Backend**  | .NET 8, Entity Framework 8, MediatR (CQRS), Swagger (OpenAPI)         |
| **Database** | SQL Server                                                            |
| **AI**       | OpenRouter (cloud-based API for LLM models)                           |
| **Testing**  | Vitest (Unit), Cypress (E2E)                                          |
| **Tooling**  | ESLint, Prettier, Docker                                              |

## Getting Started Locally

To set up and run this project on your local machine, you will need to configure both the frontend and backend environments.

### Prerequisites

- **Node.js**: Version `~20.19.0` (as specified in `.nvmrc`). We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.
- **.NET SDK**: Version 8.0 or newer.
- **SQL Server**: A running instance of SQL Server (LocalDB, Express, or full version).
- **OpenRouter API Key**: Sign up at [OpenRouter](https://openrouter.ai/) to get your API key.

### Setup and Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/mbujoczek/10xdevs-project.git
   cd 10xdevs-project
   ```

2. **Configure OpenRouter API Key:**

   ```sh
   # Navigate to the backend API project
   cd backend/src/10xdevs.Api

   # Set your OpenRouter API key in user secrets
   dotnet user-secrets set "OpenRouter:ApiKey" "sk-or-v1-YOUR-API-KEY-HERE"
   ```

3. **Set up the Backend:**
   For detailed instructions on restoring dependencies, configuring the database, and running the API, see the [Backend README](./backend/README.md).

4. **Set up the Frontend:**
   For detailed instructions on installing dependencies and running the development server, please see the [Frontend README](./frontend/README.md).

## Project Scope

The initial version (MVP) of the project focuses on delivering the core functionalities required for an effective flashcard generation and learning experience.

### Key Features (In Scope for MVP)

- **User Authentication**: Secure account creation and login using JWT.
- **AI-Powered Generation**: Create flashcard suggestions from text in English and Polish using OpenRouter API.
- **Review Workflow**: A dedicated interface to accept, edit, or reject AI-generated cards.
- **Flashcard Management**: Manually create, read, update, and delete flashcards.
- **Spaced Repetition System (SRS)**: An integrated learning session based on the SM-2 algorithm.
- **Multilingual UI**: Support for both English and Polish languages.

### Out of Scope for MVP

- Advanced SRS algorithms and user-configurable settings.
- Importing files (e.g., PDF, DOCX).
- Organizing flashcards into decks or folders.
- Sharing flashcard sets with other users.
- Social login (e.g., Google, Facebook).

## Project Status

This project is currently **in active development**. The core features for the MVP are being implemented.

## License

This project is licensed under the MIT License.
