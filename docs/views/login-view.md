# Login View Implementation Plan

## 1. Overview

The Login View (`LoginView`) allows registered users to authenticate themselves in the application. After a successful login, the user receives a JWT token, which is used for authorization in subsequent API requests, and is then redirected to the main application dashboard. This view is a key element of the authentication system and serves as the entry point for returning users.

## 2. View Routing

The view will be available at the following path in the Vue Router system:

- **Path:** `/login`
- **Route Name:** `login`

Additionally, a navigation guard should be implemented to prevent authenticated users from accessing this page, automatically redirecting them to the main dashboard (`/`).

## 3. Component Structure

The component hierarchy for the login view will be simple and modular to ensure reusability and separation of concerns.

```
LoginView.vue
└── LoginForm.vue
    ├── BaseInput.vue (for username)
    ├── BaseInput.vue (for password)
    └── BaseButton.vue (for "Login" button)
```

- **`LoginView.vue`**: The main view component, responsible for the layout, handling business logic (API communication, state management), and displaying error messages.
- **`LoginForm.vue`**: The form component, responsible for collecting user data, field validation, and emitting a `submit` event.

## 4. Component Details

### `LoginView.vue`

- **Component Description**: The container for the login view. It manages the loading and error states, communicates with the `authStore` (Pinia) to perform the login action, and handles redirection after successful authentication.
- **Main Elements**:
  - A header (e.g., `<h1>Login</h1>`).
  - The `LoginForm` component, which listens for the `submit` event.
  - A space for displaying global errors (e.g., server errors, invalid credentials).
  - A link to the registration page (`<router-link to="/register">`).
- **Handled Interactions**:
  - Receives the `submit` event from `LoginForm` and initiates the login process.
- **Handled Validation**: None (delegated to `LoginForm`).
- **Types**: `LoginRequest`, `LoginResponse`.
- **Props**: None.

### `LoginForm.vue`

- **Component Description**: A reusable form for entering login credentials. It contains the logic for field validation and informs the parent component about a login attempt.
- **Main Elements**:
  - A form (`<form>`) with `@submit.prevent` event handling.
  - `BaseInput` for the username with `autofocus`.
  - `BaseInput` for the password (type `password`).
  - `BaseButton` to submit the form, with support for `loading` and `disabled` states.
- **Emitted Events**:
  - `@submit(credentials: LoginRequest)`: Emitted after clicking the "Login" button when the form is correctly validated. It passes the login credentials.
- **Handled Validation**:
  - **Username**:
    - The field is required (cannot be empty).
  - **Password**:
    - The field is required (cannot be empty).
- **Types**: `LoginRequest`.
- **Props**:
  - `isLoading: boolean`: Informs the form whether the login process is in progress to disable the button and/or show a loading indicator.

## 5. Types

The implementation will use existing types from `frontend/src/types/auth.types.ts`.

- **`LoginRequest`**: The object sent in the request body to the API.
  ```typescript
  export interface LoginRequest {
    username: string;
    password: string;
  }
  ```
- **`LoginResponse`**: The object received from the API upon successful login.
  ```typescript
  export interface LoginResponse {
    id: number;
    username: string;
    token: string;
    expiresAt: string;
  }
  ```

## 6. State Management

Authentication state will be managed centrally using **Pinia**. An existing `auth.store.ts` should be created or used.

- **Store (`auth.store.ts`)**:
  - **State**:
    - `user: Ref<User | null>`: Stores the logged-in user's data.
    - `token: Ref<string | null>`: Stores the JWT token.
    - `isAuthenticated: ComputedRef<boolean>`: A computed property that returns `true` if the token exists and is valid.
  - **Actions**:
    - `async login(credentials: LoginRequest)`:
      1. Calls the login API.
      2. On success, saves the `user` and `token` to the state and `localStorage`.
      3. On failure, throws an exception to be handled in the component.
    - `logout()`: Clears the state and `localStorage`.
- **`LoginView.vue` Component**:
  - Will use the `login` action from the `authStore`.
  - Will manage local `isLoading` and `error` states based on the action's result.

## 7. API Integration

Integration with the backend will involve sending a `POST` request to the login endpoint.

- **Endpoint**: `/api/auth/login`
- **Method**: `POST`
- **Request Type**: `LoginRequest`
- **Success Response Type**: `LoginResponse`
- **Code Handling**:

  - A function should be created in the API layer (e.g., `api/auth.api.ts`) responsible for sending the request.

  ```typescript
  // api/auth.api.ts
  import type { LoginRequest, LoginResponse } from '@/types/auth.types';

  export const loginUser = async (
    credentials: LoginRequest
  ): Promise<LoginResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      // Throwing an error allows it to be handled in a catch block in the store or component
      throw new Error('Authentication failed');
    }

    return response.json();
  };
  ```

## 8. User Interactions

- **Data Entry**: The user types their username and password into the respective fields. The form state is updated in real-time.
- **Form Submission**: The user clicks the "Login" button.
  - The application runs validation.
  - If validation passes, the button is disabled, and a loading indicator is displayed.
  - The application sends a request to the API.
- **Navigation**: The user can click the "Don't have an account? Register" link to navigate to the registration view.

## 9. Conditions and Validation

- **Client-Side Validation**:
  - **Component**: `LoginForm.vue`
  - **Conditions**:
    - The `username` field cannot be empty.
    - The `password` field cannot be empty.
  - **UI Impact**:
    - Validation error messages appear under the respective fields if they are invalid (e.g., after losing focus or attempting to submit an empty form).
    - The "Login" button is `disabled` until both fields are filled.

## 10. Error Handling

- **Invalid Credentials (401 Error)**:
  - Upon receiving a 401 status from the API, `LoginView` will display a clear message to the user, e.g., "The username or password is incorrect," above the form.
- **Server Errors (5xx Errors)**:
  - In case of a server error, `LoginView` will display a generic message, e.g., "An unexpected error occurred. Please try again later."
- **No Network Connection**:
  - The API call should be wrapped in a `try...catch` block. In case of a network error, a message like "No network connection." should be displayed.
- **Validation Errors (400 Error)**:
  - Although unlikely for login, this case should be handled by displaying a generic error message.

## 11. Implementation Steps

1.  **Routing**: Add a new route for `/login` in the `router/index.ts` file, pointing to the `LoginView.vue` component.
2.  **File Structure**: Create the file `frontend/src/features/authentication/views/LoginView.vue`.
3.  **`LoginView.vue` Component**:
    - Create the basic structure with a header and a link to registration.
    - Import and use the `authStore`.
    - Define local state for `isLoading` and `error`.
    - Implement the `handleLogin` method that calls the `login` action from the store, handles errors, and manages redirection using `useRouter`.
4.  **`LoginForm.vue` Component**:
    - Create the file `frontend/src/features/authentication/components/LoginForm.vue`.
    - Build the form using `BaseInput` and `BaseButton` components.
    - Implement validation logic (e.g., using Vuelidate or built-in Vuetify functions).
    - Define props (`isLoading`) and the emitted event (`@submit`).
    - Bind the button's `disabled` state to the validation result.
5.  **State Management (Pinia)**:
    - Ensure `auth.store.ts` exists and has the required logic (state for `user`, `token`; actions for `login`, `logout`).
    - Implement saving the token to `localStorage` in the `login` action and removing it in `logout`.
6.  **API Layer**:
    - In `api/auth.api.ts`, add the `loginUser` function to communicate with the `/api/auth/login` endpoint.
7.  **Styling**: Add SCSS styles to make the view consistent with the rest of the application, ensuring responsiveness.
8.  **Tests**:
    - **Unit Tests (Vitest)**: Write tests for `LoginForm.vue` (validation, event emission) and for the logic in `auth.store.ts`.
    - **E2E Tests (Cypress)**: Create a test that simulates the entire user login process, from filling out the form to being redirected to the dashboard.
