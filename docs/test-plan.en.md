# Application Test Plan

## 1. Introduction and Testing Objectives

### 1.1. Introduction

This document describes a comprehensive test plan for the AI Flashcard Generator application, a learning platform that uses intelligent flashcards. The plan covers the strategy, scope, resources, and schedule of testing activities aimed at ensuring the highest quality of the final product. The project consists of a Vue.js frontend application, a .NET backend with CQRS architecture, and a SQL Server database.

### 1.2. Testing Objectives

The main goal of the testing process is to verify that the application meets functional and non-functional requirements, as well as to ensure its stability, security, and usability.

**Specific Objectives:**

- Ensure the correct operation of key functionalities (registration, login, flashcard generation, learning process).
- Verify data consistency and integrity within the system.
- Ensure high performance and responsiveness of the application under load.
- Identify and eliminate security vulnerabilities.
- Ensure intuitiveness and a high-quality user experience (UX).
- Verify the correct integration between the frontend, backend, and the AI service (OpenRouter).

## 2. Scope of Tests

### 2.1. Functionalities Covered by Tests:

- **Authentication Module:** Registration, login, session management.
- **Flashcard Management Module:**
  - Manual creation, editing, and deletion of flashcards.
  - Automatic generation of flashcards from text using AI.
  - Browsing the list of flashcards.
- **Learning Module:**
  - Starting and ending learning sessions.
  - Displaying flashcards for review (SRS algorithm).
  - Rating answers (easy, good, difficult).
- **Statistics Module:** Presentation of learning progress and efficiency indicators.
- **AI Integration:** Correct communication with OpenRouter, handling of responses and errors.

### 2.2. Functionalities Excluded from Tests:

- Tests of the AI model itself (e.g., Mistral 7B) for the quality of generated content (we assume the external service works correctly).
- Tests of the server infrastructure (apart from the configuration in Docker containers).

## 3. Types of Tests

The testing process will be divided into the following levels and types:

| Level        | Test Type                  | Description                                                                                                                                       | Technologies                         | Responsibility                    |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------- |
| **Frontend** | **Unit Tests**             | Testing individual Vue components, composable functions, and logic in Pinia stores in isolation.                                                  | Vitest                               | Frontend Developers               |
|              | **Component Tests**        | Testing interactions within more complex components or groups of components.                                                                      | Vitest                               | Frontend Developers               |
|              | **End-to-End (E2E) Tests** | Simulating real user scenarios in the browser, verifying complete flows (e.g., from login to the end of a learning session).                      | Cypress                              | QA Engineer / Developers          |
| **Backend**  | **Unit Tests**             | Testing individual classes, methods, CQRS handlers, and domain logic in isolation from dependencies (e.g., the database).                         | xUnit, NSubstitute, FluentAssertions | Backend Developers                |
|              | **Integration Tests**      | Verifying cooperation between application layers (API, Application, Infrastructure), including interaction with the database in a test container. | xUnit, Testcontainers                | Backend Developers                |
| **System**   | **API Tests**              | Testing the public API (endpoints) for contract correctness, request handling, responses, and status codes.                                       | Postman, Insomnia                    | QA Engineer / Backend Developers  |
|              | **Performance Tests**      | Examining system behavior under load, measuring response times and resource consumption.                                                          | JMeter, k6                           | QA Engineer                       |
|              | **Security Tests**         | Identifying potential vulnerabilities (e.g., SQL Injection, XSS, authorization issues).                                                           | OWASP ZAP                            | QA Engineer / Security Specialist |
|              | **Usability Tests**        | Evaluating the user interface for intuitiveness, clarity, and overall experience.                                                                 | Manual analysis                      | QA Engineer / UX Designer         |

## 4. Test Scenarios for Key Functionalities

### 4.1. Registration and Login

- **TC1:** Successful registration of a new user with valid data.
- **TC2:** Attempt to register with a taken username.
- **TC3:** Successful login with valid credentials.
- **TC4:** Attempt to log in with an incorrect password.
- **TC5:** Validation of form fields (e.g., required fields).

### 4.2. Generating Flashcards from Text (AI)

- **TC6:** Successful generation of flashcards after entering valid text.
- **TC7:** Verification that the generated flashcards have the correct structure (question/answer).
- **TC8:** Handling of an error from the OpenRouter API (e.g., limit exceeded, server error).
- **TC9:** Verification of the application's behavior when trying to generate flashcards from empty text.

### 4.3. Learning Session

- **TC10:** Starting a learning session and correctly displaying the first flashcard.
- **TC11:** Rating a flashcard and verifying that the date of the next review has been calculated correctly.
- **TC12:** Ending the session after reviewing all scheduled flashcards.

## 5. Test Environment

- **Development Environment (local):** Run locally on developers' machines using `docker-compose`. Used for unit and integration tests.
- **Test Environment (staging):** A separate, dedicated instance of the application deployed in an environment similar to production. E2E, API, performance, and UAT (User Acceptance Testing) tests will be conducted in this environment.
- **Database:** For integration and E2E tests, a dedicated SQL Server database will be used, running in a Docker container, with data reset before each test cycle.

## 6. Testing Tools

| Tool                   | Application                                                |
| ---------------------- | ---------------------------------------------------------- |
| **Vitest**             | Unit and component tests for the frontend (Vue.js).        |
| **Cypress**            | End-to-End (E2E) tests for the frontend.                   |
| **xUnit**              | Unit tests for the backend (.NET).                         |
| **NSubstitute**        | Library for mocking dependencies in backend tests.         |
| **FluentAssertions**   | Library for creating readable assertions in backend tests. |
| **Postman / Insomnia** | Manual and automated API tests.                            |
| **JMeter / k6**        | Performance and load tests for the API.                    |
| **OWASP ZAP**          | Scanning for basic security vulnerabilities.               |
| **GitHub**             | System for test management and bug reporting.              |
