# UI Architecture for AI Flashcard Generator

## 1. UI Structure Overview

The UI architecture is designed to be feature-oriented, modular, and scalable, utilizing Vue 3 with the Composition API, TypeScript, and Vuetify for the component library. The structure is centered around clear user flows, from authentication to flashcard generation, review, management, and learning.

State management will be handled by Pinia, with dedicated stores for different domains (`auth`, `flashcards`, `generation`, `learning`, `ui`). This ensures a clear separation of concerns and centralized business logic. API communication is abstracted into a dedicated `api/` layer, with Axios interceptors managing global concerns like JWT injection and loading state.

The user experience is prioritized through a responsive design, a global loading overlay for all API requests, a consistent notification system for user feedback, and client-side validation to provide immediate responses.

## 2. Views List

### 2.1. Login View

- **View Name**: `LoginView.vue`
- **View Path**: `/login`
- **Main Purpose**: To allow registered users to authenticate and access the application.
- **Key Information to Display**: Username and password input fields, login button, link to the registration view.
- **Key View Components**: `BaseInput` for credentials, `BaseButton` for submission.
- **UX, Accessibility, and Security**:
  - **UX**: Clear error messages for invalid credentials or server errors. Autofocus on the username field.
  - **Accessibility**: Proper labels for inputs, keyboard navigation support.
  - **Security**: Password input should be of type `password`. Communication with the API must be over HTTPS.

### 2.2. Register View

- **View Name**: `RegisterView.vue`
- **View Path**: `/register`
- **Main Purpose**: To allow new users to create an account.
- **Key Information to Display**: Username and password input fields, registration button, link to the login view.
- **Key View Components**: `BaseInput` for credentials, `BaseButton` for submission.
- **UX, Accessibility, and Security**:
  - **UX**: Real-time validation for username availability and password strength. Clear success/error notifications.
  - **Accessibility**: ARIA attributes for validation feedback.
  - **Security**: Enforce minimum password length. Prevent username enumeration by providing a generic "Username already exists" message.

### 2.3. Dashboard View

- **View Name**: `DashboardView.vue`
- **View Path**: `/` (Home)
- **Main Purpose**: To serve as the central hub for the user after logging in, providing quick access to core functionalities.
- **Key Information to Display**: Welcome message, summary of due flashcards for review, main action buttons.
- **Key View Components**: `BaseCard` for displaying statistics, `BaseButton` for navigation ("Start Learning", "Generate Flashcards", "My Flashcards").
- **UX, Accessibility, and Security**:
  - **UX**: Clear and concise presentation of key actions. A disabled "Start Learning" button if no cards are due.
  - **Accessibility**: Buttons should have clear, descriptive labels.
  - **Security**: This route must be protected and accessible only to authenticated users.

### 2.4. Generate Flashcards View

- **View Name**: `GenerateView.vue`
- **View Path**: `/generate`
- **Main Purpose**: To allow users to input text for AI-powered flashcard generation.
- **Key Information to Display**: A large text area for input and a "Generate" button.
- **Key View Components**: `BaseInput` (textarea), `BaseButton`.
- **UX, Accessibility, and Security**:
  - **UX**: Character counter for the text area. A global loading overlay is displayed during generation.
  - **Accessibility**: The text area should have a proper label.
  - **Security**: This route must be protected. Client-side validation to enforce character limits before sending to the API.

### 2.5. Review Flashcards View

- **View Name**: `ReviewView.vue`
- **View Path**: `/review/:eventId`
- **Main Purpose**: To allow users to review, edit, accept, or reject AI-generated flashcard candidates.
- **Key Information to Display**: A list of flashcard candidates, each with a question and answer. Controls for each candidate (Accept, Edit, Reject). A "Finish Review" button.
- **Key View Components**: `BaseCard` for each candidate, `BaseButton` for actions, `EditFlashcardModal` for editing.
- **UX, Accessibility, and Security**:
  - **UX**: Visual distinction for the status of each card (e.g., green border for accepted, yellow for edited). The state is ephemeral and managed in the `generation` store until finalized.
  - **Accessibility**: Keyboard-friendly controls for managing candidates.
  - **Security**: This route must be protected. The user can only access events they initiated.

### 2.6. Flashcards List View

- **View Name**: `FlashcardsView.vue`
- **View Path**: `/flashcards`
- **Main Purpose**: To display all of the user's saved flashcards and allow for their management.
- **Key Information to Display**: A list of all user flashcards.
- **Key View Components**: `BaseCard` for each flashcard, `BaseButton` for "Add New" and actions (Edit, Delete), `EditFlashcardModal`, `BaseConfirmModal` for deletion.
- **UX, Accessibility, and Security**:
  - **UX**: An `EmptyState` component is shown if the user has no flashcards. Confirmation is required for deletion.
  - **Accessibility**: The list should be navigable, and all actions clearly labeled.
  - **Security**: This route must be protected.

### 2.7. Learning Session View

- **View Name**: `LearningSessionView.vue`
- **View Path**: `/learn`
- **Main Purpose**: To guide the user through a spaced repetition learning session.
- **Key Information to Display**: The question of the current flashcard, a "Show Answer" button, the answer (once revealed), and rating controls (0-5).
- **Key View Components**: `BaseCard` to display the flashcard, `BaseButton` for showing the answer, a grid of rating buttons.
- **UX, Accessibility, and Security**:
  - **UX**: Smooth transition/animation when revealing the answer. After rating, the next card is loaded automatically. An `EmptyState` view is shown if no cards are due.
  - **Accessibility**: The entire flow should be manageable with a keyboard.
  - **Security**: This route must be protected.

### 2.8. Learning Summary View

- **View Name**: `LearningSummaryView.vue`
- **View Path**: `/learn/summary`
- **Main Purpose**: To display a summary of the completed learning session.
- **Key Information to Display**: Number of flashcards reviewed, performance statistics, and a button to return to the dashboard.
- **Key View Components**: `BaseCard` for statistics, `BaseButton` for navigation.
- **UX, Accessibility, and Security**:
  - **UX**: A clear, motivating summary to encourage future learning.
  - **Accessibility**: All data should be presented in a clear, readable format.
  - **Security**: This route must be protected.

### 2.9. Statistics View

- **View Name**: `StatisticsView.vue`
- **View Path**: `/statistics`
- **Main Purpose**: To display global statistics about AI flashcard generation quality.
- **Key Information to Display**: Total candidates, acceptance rate, pure acceptance rate, and whether the success metric is met.
- **Key View Components**: `BaseCard` to display metrics.
- **UX, Accessibility, and Security**:
  - **UX**: Simple, easy-to-understand data visualization.
  - **Accessibility**: Data should be clearly labeled.
  - **Security**: This route must be protected.

## 3. User Journey Map

The primary user journey involves generating flashcards from text and then learning them.

1.  **Authentication**:

    - A new user starts at `RegisterView` (`/register`), creates an account, and is redirected to `DashboardView` (`/`).
    - A returning user starts at `LoginView` (`/login`), logs in, and is redirected to `DashboardView` (`/`).

2.  **Main Use Case: Generation & Learning**:
    - **Step 1**: From the `DashboardView` (`/`), the user clicks "Generate Flashcards" and is navigated to `GenerateView` (`/generate`).
    - **Step 2**: In `GenerateView`, the user pastes text, selects a language, and clicks "Generate". A global loading overlay appears.
    - **Step 3**: Upon successful generation, the user is redirected to `ReviewView` (`/review/:eventId`).
    - **Step 4**: In `ReviewView`, the user reviews each candidate, choosing to `Accept`, `Reject`, or `Edit` (which opens `EditFlashcardModal`).
    - **Step 5**: After reviewing, the user clicks "Finish Review". The accepted/edited flashcards are saved, and the user is redirected to `FlashcardsView` (`/flashcards`) or `DashboardView` (`/`).
    - **Step 6**: From the `DashboardView` (`/`), the user clicks "Start Learning" and is taken to `LearningSessionView` (`/learn`).
    - **Step 7**: In `LearningSessionView`, the user sees a question, reveals the answer, and rates their recall (0-5). This process repeats for all due cards.
    - **Step 8**: After the session, the user is redirected to `LearningSummaryView` (`/learn/summary`) to see their results.
    - **Step 9**: From the summary, the user navigates back to the `DashboardView` (`/`).

## 4. Layout and Navigation Structure

- **Main Layout**: A default layout (`DefaultLayout.vue`) will contain a persistent navigation bar and a main content area where the router view is rendered.
- **Navigation Bar**: The top navigation bar will contain:
  - The application logo/name.
  - Navigation links: "Dashboard", "My Flashcards", "Generate", "Statistics".
  - A `LanguageSwitcher` component.
  - A "Logout" button.
- **Authentication Layout**: A separate, simpler layout (`AuthLayout.vue`) will be used for the `LoginView` and `RegisterView`, containing only the form and no main navigation.
- **Routing**: Vue Router will manage navigation. Routes requiring authentication will be protected by a global `beforeEach` guard that checks for a valid JWT in the `auth` store.

## 5. Key Components

- **`BaseButton.vue`**: A wrapper around Vuetify's button component to ensure consistent styling and props across the application.
- **`BaseInput.vue`**: A wrapper for Vuetify's text fields and text areas, pre-configured with standard validation rules and styling.
- **`BaseCard.vue`**: A wrapper for Vuetify's card component, used for displaying flashcards, statistics, and other containerized content.
- **`BaseModal.vue`**: A generic modal component for hosting forms like flashcard editing.
- **`BaseConfirmModal.vue`**: A specialized modal for confirming destructive actions, such as deleting a flashcard.
- **`LanguageSwitcher.vue`**: A component for switching the application's language (PL/EN).
- **`EmptyState.vue`**: A reusable component to display when a list is empty (e.g., no flashcards, no due cards for review).
