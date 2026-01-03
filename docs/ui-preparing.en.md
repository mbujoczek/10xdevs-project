<conversation_summary>
<decisions>

1.  **Main Dashboard (`DashboardView.vue`)**: It will aggregate data from various endpoints, featuring buttons to start a learning session, generate flashcards, and navigate to the flashcard list.
2.  **Flashcard Review Process**: The state of flashcard candidates will be managed in a dedicated Pinia module (`generation.store.ts`). The review session is held in the store and is reset upon completion or dismissal. The interface will visually distinguish the status of flashcards (accepted, edited, rejected) using borders/icons and disable inappropriate actions.
3.  **Flashcard Editing**: Will be done in an `EditFlashcardModal.vue` modal window invoked from the flashcard list.
4.  **Notifications and Errors**: A global notification system (toasts) will be implemented as a composable (`useNotifications`) using an open-source library.
5.  **Language Switching**: A language switch option (PL/EN, with EN as default) will be implemented as a `LanguageSwitcher.vue` component in the top-right corner, using `localStorage` and `vue-i18n`.
6.  **Learning Session**: The `LearningSessionView.vue` will first show the question, then the answer with an animation. Ratings (0-5) will send a request to the API and load the next flashcard. After the session, the user will be redirected to a summary view (`LearningSummaryView.vue`) with statistics.
7.  **Routing and Authorization**: A global `beforeEach` guard will be implemented in `router/index.ts` to protect routes. JWT expiration will trigger automatic logout and redirection to the login page.
8.  **Base Components**: `BaseButton.vue`, `BaseCard.vue`, `BaseInput.vue`, and `BaseModal.vue` components will be created as wrappers for Vuetify components.
9.  **State Management (Pinia)**: Modules will be created for `auth.store.ts`, `flashcards.store.ts`, `learning.store.ts`, `generation.store.ts`, and `ui.store.ts`.
10. **Statistics View**: A simple `StatisticsView.vue` will display global percentage metrics on flashcard generation quality.
11. **Flashcard List**: For the MVP, there will be no pagination; all of the user's flashcards will be displayed in a single list.
12. **Global Loading State**: Every API request will trigger a global, blocking loading mask (`v-overlay` from Vuetify) managed by `ui.store.ts` and Axios interceptors.
13. **Flashcard Deletion**: The process will require confirmation in a `BaseConfirmModal.vue` dialog.
14. **Responsiveness**: Key views will be responsive, using the Vuetify grid system.
15. **Form Validation**: Client-side validation will be implemented using Vuetify's built-in `rules` attributes in `BaseInput.vue` components.
16. **Business Logic Structure**: The `services` layer is eliminated. Business logic will be placed directly within Pinia modules (store), which will communicate with the `api` layer.
    </decisions>
    <matched_recommendations>

- **Global Loading Mask**: Instead of individual skeleton loaders, every API call will activate a global, blocking mask (`v-overlay`), managed by a dedicated `ui.store.ts` and Axios interceptors.
- **Route Structure**: A nested route structure with lazy loading for individual views will be implemented to optimize performance.
- **Handling Empty and Error States**: The application will use dedicated components (`EmptyState.vue`) to handle situations where data is missing (e.g., no flashcards to review) and a consistent notification system (toast) to inform about errors and successes.
- **Client-Side Validation**: Forms will use Vuetify's built-in validation mechanisms (`rules`) to provide immediate feedback to the user and reduce server requests.
- **Logic Architecture**: Business logic will be consolidated into Pinia modules, eliminating the need for an additional `services` layer. The `store` modules will orchestrate calls to the `api` layer.
- **Base Components and UI Consistency**: Wrapper base components (`BaseButton`, `BaseInput`, etc.) and a defined set of icons (`mdi-pencil`, `mdi-delete`, etc.) will be created to ensure visual and functional consistency throughout the application.
- **User Session Management**: Authentication state, user data, and the JWT will be managed in `auth.store.ts`. Route protection and automatic logout on token expiration will ensure security.
- **Responsiveness**: The interface will be fully responsive, with layouts adapting to different screen sizes (e.g., buttons in a column on mobile, 2x3 rating grid) using the Vuetify grid system.
  </matched_recommendations>
  <ui_architecture_planning_summary>
  Based on the discussions, the UI architecture for the AI Flashcard Generator MVP will be based on the Vue 3 framework with Vuetify and TypeScript. The architecture will be feature-oriented (`features`), ensuring scalability and modularity.

**Key Views and User Flows:**

- **Authentication**: Separate views for login (`LoginView.vue`) and registration (`RegisterView.vue`).
- **Main Dashboard (`DashboardView.vue`)**: The central hub of the application after login, aggregating key actions: starting a learning session, generating flashcards, and accessing the flashcard list.
- **Generation and Review**: The user inputs text in `GenerateView.vue` and then proceeds to `ReviewView.vue` to manage flashcard candidates. The review state is ephemeral and managed in `generation.store.ts`.
- **Flashcard Management**: `FlashcardsView.vue` will display a list of all the user's flashcards. Editing and deleting will be handled through modal dialogs (`EditFlashcardModal.vue`, `BaseConfirmModal.vue`).
- **Learning Session**: `LearningSessionView.vue` will guide the user through the review process. After the session, `LearningSummaryView.vue` will display a summary.
- **Other**: `StatisticsView.vue` for presenting global metrics, `EmptyState.vue` for handling empty views.

**API Integration and State Management:**

- **API Layer**: Communication with the backend will be isolated in the `src/api` directory, with separate files for each resource. A central Axios instance with interceptors will manage the addition of JWTs and error handling.
- **State Management (Pinia)**: Business logic and application state will be placed in Pinia modules (`auth`, `flashcards`, `learning`, `generation`, `ui`). These modules will orchestrate API calls and manage data.
- **Global States**: `ui.store.ts` will manage the global loading state, activating a blocking mask (`v-overlay`) during each API request.

**Responsiveness, Accessibility, and Security:**

- **Responsiveness**: The application will be fully responsive, using the Vuetify grid system to adapt the layout on mobile devices.
- **Accessibility**: The use of semantic Vuetify components and attention to clear error messages and empty states will contribute to better accessibility.
- **Security**: Routes will be protected using Vue Router guards. The authentication state and JWT will be securely managed in `auth.store.ts`, and session expiration will be handled automatically.

**UI/UX:**

- **Consistency**: Ensured by a set of base components, predefined icons, and global styles.
- **User Feedback**: The application will provide immediate feedback through "live" form validation, a global loading mask, and a notification system (toasts) for errors and successes.
  </ui_architecture_planning_summary>
  <unresolved_issues>
  There are no unresolved issues. All points have been clarified and agreed upon, allowing for the transition to the implementation phase.
  </unresolved_issues>
  </conversation_summary>
