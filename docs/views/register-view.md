# RegisterView Implementation Plan

## 1. Overview

The `RegisterView` enables new users to create an account in the AI Flashcard Generator application. This view provides a registration form with real-time validation, error handling, and automatic login after successful registration. It is a key element of the user onboarding process that must be intuitive, secure, and accessible.

## 2. View Routing

- **Path:** `/register`
- **Route Name:** `register`
- **Meta:** `{ requiresGuest: true }` - view accessible only to unauthenticated users
- **Components:** Lazy loading using `import()`

```typescript
{
  path: '/register',
  name: 'register',
  component: () => import('@/features/authentication/views/RegisterView.vue'),
  meta: { requiresGuest: true }
}
```

**Navigation guard:** Use existing `router.beforeEach` that checks `requiresGuest`, redirecting authenticated users to the home page.

## 3. Component Structure

```
RegisterView.vue (main view)
└── RegisterForm.vue (registration form)
    ├── BaseInput (username field)
    ├── BaseInput (password field)
    ├── BaseInput (confirm password field - optional)
    └── BaseButton (submit button)
```

**Existing components to use:**

- `BaseInput.vue` - input component with validation
- `BaseButton.vue` - button component with loading state support
- `v-card`, `v-container` - Vuetify components for layout

## 4. Component Details

### 4.1. RegisterView.vue

**Description:** Main registration view responsible for page layout composition, registration logic handling, and navigation after successful account creation.

**Main elements:**

- `v-container` with Vuetify classes for centering (`d-flex align-center justify-center fill-height`)
- `v-card` as form container (width: 400px)
- `v-card-title` with title "Register" (internationalized)
- `v-card-text` containing `RegisterForm` component
- Footer with link to login view for existing users

**Handled events:**

- `@submit` from `RegisterForm` component - calls `handleRegister` handler

**Validation conditions:**

- None - validation happens in `RegisterForm` component

**Types:**

- `RegisterRequest` (import from `@/types/auth.types`)

**Props:**

- None - view doesn't accept props

**Logic:**

```typescript
const handleRegister = async (data: RegisterRequest) => {
  await authStore.register(data);
  await router.push('/');
};
```

### 4.2. RegisterForm.vue

**Description:** Registration form component containing username and password fields, real-time validation, and submit handling. Responsible for form state management and emitting events after successful validation. Component is modeled after `LoginForm.vue` and uses Vuetify classes for styling.

**Main elements:**

- `v-form` with validation ref (`formRef`) and `@submit.prevent` handler
- `BaseInput` for username with appropriate validation rules
- `BaseInput` for password with type "password" and validation rules
- `BaseButton` of type submit with disabled/loading state support
- Styling using Vuetify classes (e.g., `mt-4`, `mt-6`) instead of custom styles

**Handled events:**

- `@submit.prevent` - form submission handling
- `update:modelValue` from `BaseInput` components - field value updates

**Validation conditions:**

**Username:**

- Required field: `!!v || t('validation.required')`
- Maximum length 50 characters: `v.length <= 50 || t('validation.usernameMaxLength')`
- No whitespace: `!v.includes(' ') || t('validation.noWhitespace')`

**Password:**

- Required field: `!!v || t('validation.required')`
- Minimum length 8 characters: `v.length >= 8 || t('validation.passwordMinLength')`

**Types:**

- `RegisterRequest` (DTO for emit)

**Props:**

- None - form is self-contained

**Emits:**

```typescript
emit: {
  submit: [data: RegisterRequest]
}
```

**Local state:**

```typescript
const username = ref<string>('');
const password = ref<string>('');
const formRef = ref<HTMLFormElement | null>(null);
```

**Computed properties:**

```typescript
const isFormValid = computed(() => {
  return (
    username.value.trim() !== '' &&
    username.value.length <= 50 &&
    !username.value.includes(' ') &&
    password.value.length >= 8
  );
});
```

**Methods:**

```typescript
const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  emit('submit', {
    username: username.value.trim(),
    password: password.value,
  });
};
```

**Note:** Submit button is controlled by computed property `isFormValid` which checks basic conditions. Additionally, on submit we call `formRef.value?.validate()` for full validation with error message display.

## 5. Types

### 5.1. Existing Types (auth.types.ts)

```typescript
export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  token: string;
  createdAtUtc: string;
}

export interface User {
  id: number;
  username: string;
}
```

**Note:** All authentication-related types are already defined in `auth.types.ts` and ready to use.

### 5.2. UI Store Types (existing - ui.store.ts)

```typescript
export interface UiState {
  isLoading: boolean;
  loadingCount: number;
}
```

## 6. State Management

### 6.1. Auth Store (extending existing)

**New action to add:**

```typescript
const register = async (data: RegisterRequest): Promise<void> => {
  const response: RegisterResponse = await registerUser(data);

  user.value = {
    id: response.id,
    username: response.username,
  };
  token.value = response.token;

  localStorage.setItem('authToken', response.token);
  localStorage.setItem('authUser', JSON.stringify(user.value));
};
```

**Location:** `frontend/src/features/authentication/store.ts`

**Export:**

```typescript
return {
  user,
  token,
  isAuthenticated,
  login,
  register, // new action
  logout,
};
```

### 6.2. UI Store (using existing)

Store `useUiStore` is already implemented and provides:

- `isLoading` - loading state
- `startLoading()` - start loading
- `stopLoading()` - stop loading

Store will be used by axios interceptors for automatic loading state handling.

### 6.3. Local State in Components

**RegisterForm.vue:**

- `username: ref<string>('')` - username field value
- `password: ref<string>('')` - password field value
- `formRef: ref<HTMLFormElement | null>(null)` - Vuetify form reference

**RegisterView.vue:**

- None - view only uses store

## 7. API Integration

### 7.1. Endpoint

**API Function:** `registerUser` (already implemented in `auth.api.ts`)

```typescript
export const registerUser = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
};
```

### 7.2. Request

**Type:** `RegisterRequest`

```typescript
{
  username: string; // required, max 50 chars, case-sensitive
  password: string; // required, min 8 chars
}
```

**Example:**

```json
{
  "username": "JohnDoe",
  "password": "securePassword123"
}
```

### 7.3. Response

**Success Response (201 Created):**

**Type:** `RegisterResponse`

```typescript
{
  id: number;
  username: string;
  token: string;
  createdAtUtc: string;
}
```

**Example:**

```json
{
  "id": 1,
  "username": "JohnDoe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "createdAtUtc": "2025-12-31T10:00:00Z"
}
```

**Error Responses:**

**400 Bad Request:**

```typescript
{
  type: string
  title: string
  status: 400
  errors: {
    [field: string]: string[]
  }
}
```

**409 Conflict:**

```typescript
{
  type: string;
  title: string;
  status: 409;
  detail: string;
}
```

### 7.4. Store Handling

```typescript
const register = async (data: RegisterRequest): Promise<void> => {
  try {
    const response: RegisterResponse = await registerUser(data);

    // Save user and token
    user.value = {
      id: response.id,
      username: response.username,
    };
    token.value = response.token;

    // Persist to localStorage
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('authUser', JSON.stringify(user.value));
  } catch (error) {
    // Errors are handled by axios interceptor
    throw error;
  }
};
```

## 8. User Interactions

### 8.1. Data Input

**Username field:**

- User clicks on username field
- Field receives focus (autofocus on first render)
- User types username
- Validation triggers on blur or submit attempt
- Display validation errors under field in real-time

**Password field:**

- User clicks on password field
- Field is type "password" (characters are masked)
- User types password
- Length validation occurs on blur or submit attempt
- Display validation errors under field

### 8.2. Registration Button

**Initial state:**

- Button inactive (disabled) until user fills all fields correctly
- `isFormValid` checks: username non-empty, max 50 chars, no spaces, password min 8 chars

**During registration:**

- Button shows loading state (spinner)
- Button is disabled
- Form fields are disabled
- User cannot modify data or click button again

**After successful registration:**

- Automatic redirect to home page (`/`)
- Token and user data saved in localStorage
- Store updated with user data

**After error:**

- Button returns to active state
- Display error message (toast notification or snackbar)
- Form fields remain filled
- User can correct data and try again

### 8.3. Login Link

- User sees text "Already have an account? Login"
- Clicking "Login" redirects to `/login`
- Use `router-link` with Vuetify classes

### 8.4. Real-time Validation

**Username validation:**

- On blur from field: check all rules
- Before submit: check all rules
- Errors displayed as `error-messages` in `BaseInput` component

**Password validation:**

- On blur from field: check minimum length
- Before submit: check minimum length
- Errors displayed as `error-messages` in `BaseInput` component

## 9. Conditions and Validation

### 9.1. Frontend Validation (RegisterForm.vue)

**Username:**

| Condition      | Error Message                            | i18n Key                       |
| -------------- | ---------------------------------------- | ------------------------------ |
| Required field | "This field is required"                 | `validation.required`          |
| Max 50 chars   | "Username must not exceed 50 characters" | `validation.usernameMaxLength` |
| No spaces      | "Username cannot contain spaces"         | `validation.noWhitespace`      |

**Password:**

| Condition      | Error Message                                 | i18n Key                       |
| -------------- | --------------------------------------------- | ------------------------------ |
| Required field | "This field is required"                      | `validation.required`          |
| Min 8 chars    | "Password must be at least 8 characters long" | `validation.passwordMinLength` |

**Rules implementation:**

```typescript
const usernameRules = [
  (v: string) => !!v || t('validation.required'),
  (v: string) => v.length <= 50 || t('validation.usernameMaxLength'),
  (v: string) => !v.includes(' ') || t('validation.noWhitespace'),
];

const passwordRules = [
  (v: string) => !!v || t('validation.required'),
  (v: string) => v.length >= 8 || t('validation.passwordMinLength'),
];
```

**Computed property for button state:**

```typescript
const isFormValid = computed(() => {
  return (
    username.value.trim() !== '' &&
    username.value.length <= 50 &&
    !username.value.includes(' ') &&
    password.value.length >= 8
  );
});
```

**Form validation on submit:**

```typescript
const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  // Send data only if validation passed
  emit('submit', {
    username: username.value.trim(),
    password: password.value,
  });
};
```

**Note:** `isFormValid` controls button state (disabled/enabled), while `formRef.value?.validate()` performs full validation on form submission attempt and displays error messages.

### 9.2. Backend Validation (API)

**Error 400 - Bad Request:**

- Backend validates same rules as frontend
- Returns `errors` object with fields and message arrays
- Frontend displays these errors via toast/snackbar

**Example response:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "password": ["Password must be at least 8 characters long"],
    "username": ["Username is required"]
  }
}
```

**Error 409 - Conflict:**

- Username already exists in system
- Backend returns generic message (security best practice)
- Frontend displays: "Username is already taken"

**Example response:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Username already exists",
  "status": 409,
  "detail": "A user with the username 'JohnDoe' already exists."
}
```

### 9.3. Validation Impact on UI

**Username field:**

- `error` prop: `true` when validation error exists
- `error-messages` prop: array of error messages
- Red border and error text below field
- ARIA attribute: `aria-invalid="true"` and `aria-describedby` pointing to error message

**Password field:**

- Same behavior as username
- Additionally type "password" for character masking

**Submit button:**

- `disabled`: `!isFormValid || isLoading`
- `loading`: `isLoading`
- Visual state change (spinner, opacity change)
- Button is inactive when `isFormValid` returns `false` or loading is in progress

## 10. Error Handling

### 10.1. Validation Errors (400 Bad Request)

**Scenario:** Backend rejects request due to invalid data

**Handling:**

1. Axios interceptor catches 400 error
2. Display toast notification with error message
3. Keep user in form
4. Display detailed validation errors (if available)

**Interceptor implementation:**

```typescript
if (error.response?.status === 400) {
  const errorData = error.response.data;
  if (errorData.errors) {
    Object.values(errorData.errors)
      .flat()
      .forEach((msg) => {
        // Display each error as toast
        showToast(msg as string, 'error');
      });
  }
}
```

### 10.2. Username Conflict (409 Conflict)

**Scenario:** User attempts to register with existing username

**Handling:**

1. Axios interceptor catches 409 error
2. Display toast: "Username is already taken. Choose another one."
3. Focus on username field
4. User can change username and try again

**Implementation:**

```typescript
if (error.response?.status === 409) {
  showToast(t('auth.register.usernameExists'), 'error');
}
```

### 10.3. Network Errors

**Scenario:** No connection to server or timeout

**Handling:**

1. Axios interceptor catches network error
2. Display toast: "Connection error. Check your internet connection."
3. Button returns to active state
4. User can try again

**Implementation:**

```typescript
if (!error.response) {
  showToast(t('errors.networkError'), 'error');
}
```

### 10.4. Server Errors (500 Internal Server Error)

**Scenario:** Unexpected server-side error

**Handling:**

1. Axios interceptor catches 500 error
2. Display toast: "Server error occurred. Try again later."
3. Log error to console (for developers)
4. User can try again

### 10.5. Timeout

**Scenario:** Request takes too long

**Handling:**

1. Axios timeout (default 30s) aborts request
2. Display toast: "Request timeout. Try again."
3. User can try again

### 10.6. Centralized Error Handling

**Location:** Axios interceptor in `frontend/src/api/axios.ts`

**Status:** ✅ Already implemented

**Current implementation:**

Axios interceptor is fully configured and handles all error types:

```typescript
api.interceptors.response.use(
  (response) => {
    const uiStore = useUiStore();
    uiStore.stopLoading();
    return response;
  },
  (error: AxiosError) => {
    const uiStore = useUiStore();
    uiStore.stopLoading();

    const { showError } = useNotifications();
    const errorMapping = mapErrorToI18nKey(error);

    const translatedMessage = i18n.global.t(errorMapping.messageKey);
    const message =
      translatedMessage !== errorMapping.messageKey
        ? translatedMessage
        : errorMapping.fallbackMessage;

    const validationErrors = extractValidationErrors(error);
    if (validationErrors) {
      const firstError = Object.values(validationErrors)[0];
      if (firstError && firstError.length > 0 && firstError[0]) {
        showError(firstError[0]);
      } else {
        showError(message);
      }
    } else {
      showError(message);
    }

    return Promise.reject(error);
  }
);
```

**Features:**

- ✅ Automatic loading stop (`uiStore.stopLoading()`)
- ✅ Display errors via composable `useNotifications`
- ✅ Map errors to i18n keys (`mapErrorToI18nKey`)
- ✅ Extract validation errors (`extractValidationErrors`)
- ✅ Display first validation error or general message
- ✅ Handle all HTTP statuses (400, 409, 500, network errors)

**Required utils:**

- `useNotifications` composable - for displaying toast notifications
- `mapErrorToI18nKey` - mapping HTTP errors to translation keys
- `extractValidationErrors` - extracting validation errors from response

**No additional implementation required** - interceptor is ready to handle registration errors.

## 11. Implementation Steps

### Step 1: Create RegisterForm.vue Component

**Location:** `frontend/src/features/authentication/components/RegisterForm.vue`

**Pattern:** `LoginForm.vue` - use the same structure and styling

**Tasks:**

- [ ] Create file structure with `<script setup>`, `<template>` modeled after `LoginForm.vue`
- [ ] Import `BaseInput`, `BaseButton`, `useUiStore`, `useI18n`, `computed`
- [ ] Define reactive variables: `username`, `password`, `formRef`
- [ ] Implement validation rules for username and password (inline in arrays)
- [ ] Create computed property `isFormValid` checking basic conditions
- [ ] Implement handler `handleSubmit` with `formRef.value?.validate()`
- [ ] Define emit `submit` with type `RegisterRequest`
- [ ] Create template with form (`v-form` with `@submit.prevent`)
- [ ] Add `BaseInput` for username with appropriate props
- [ ] Add `BaseInput` for password with type "password" and class `mt-4`
- [ ] Add `BaseButton` of type submit with `:disabled="!isFormValid || isLoading"`, `block`, class `mt-6`
- [ ] Use Vuetify classes for spacing (`mt-4`, `mt-6`) instead of custom styles

### Step 2: Extend Auth Store

**Location:** `frontend/src/features/authentication/store.ts`

**Tasks:**

- [ ] Add import `registerUser` from `@/api/auth.api`
- [ ] Add import of types `RegisterRequest`, `RegisterResponse`
- [ ] Implement action `register` analogously to `login`
- [ ] Save token and user to localStorage
- [ ] Update reactive variables `user` and `token`
- [ ] Add `register` to return statement of store
- [ ] Handle errors (re-throw for interceptor)

### Step 3: Create RegisterView.vue

**Location:** `frontend/src/features/authentication/views/RegisterView.vue`

**Pattern:** `LoginView.vue` - use the same layout structure

**Tasks:**

- [ ] Create file structure with `<script setup>`, `<template>` modeled after `LoginView.vue`
- [ ] Import `RegisterForm`, `useAuthStore`, `useRouter`, `useI18n`
- [ ] Implement handler `handleRegister` calling `authStore.register`
- [ ] After successful registration redirect to `/` using `router.push`
- [ ] Create template with Vuetify layout identical to `LoginView.vue`:
  - `v-container` with classes `d-flex align-center justify-center fill-height fluid`
  - `v-card` with `width="400"` and class `pa-6`
  - `v-card-title` with classes `text-h5 text-center mb-6`
  - `v-card-text` with class `pa-0` containing `RegisterForm`
- [ ] Add title with internationalization `{{ t('auth.register.title') }}`
- [ ] Place `RegisterForm` component with binding `@submit="handleRegister"`
- [ ] Add footer `v-card-text` with classes `text-center text-body-2 mt-4`
- [ ] Add link to `/login` with classes `text-primary text-decoration-none font-weight-medium`

### Step 4: Add Route in Router

**Location:** `frontend/src/router/index.ts`

**Tasks:**

- [ ] Add new route for `/register`
- [ ] Set `name: 'register'`
- [ ] Configure lazy loading of component
- [ ] Add `meta: { requiresGuest: true }`
- [ ] Ensure navigation guard handles `requiresGuest`

### Step 5: Add Internationalization Keys

**Location:** `frontend/src/i18n/` (language files)

**Tasks for Polish:**

```json
{
  "auth": {
    "register": {
      "title": "Rejestracja",
      "username": "Nazwa użytkownika",
      "password": "Hasło",
      "submit": "Zarejestruj się",
      "hasAccount": "Masz już konto?",
      "login": "Zaloguj się",
      "usernameExists": "Nazwa użytkownika jest już zajęta. Wybierz inną."
    }
  },
  "validation": {
    "required": "To pole jest wymagane",
    "usernameMaxLength": "Nazwa użytkownika nie może przekraczać 50 znaków",
    "noWhitespace": "Nazwa użytkownika nie może zawierać spacji",
    "passwordMinLength": "Hasło musi mieć co najmniej 8 znaków"
  }
}
```

**Tasks for English:**

```json
{
  "auth": {
    "register": {
      "title": "Register",
      "username": "Username",
      "password": "Password",
      "submit": "Sign up",
      "hasAccount": "Already have an account?",
      "login": "Login",
      "usernameExists": "Username is already taken. Choose another one."
    }
  },
  "validation": {
    "required": "This field is required",
    "usernameMaxLength": "Username must not exceed 50 characters",
    "noWhitespace": "Username cannot contain spaces",
    "passwordMinLength": "Password must be at least 8 characters long"
  }
}
```

### Step 6: Update LoginView

**Location:** `frontend/src/features/authentication/views/LoginView.vue`

**Tasks:**

- [ ] Add link to registration in footer (if doesn't exist)
- [ ] Ensure text is internationalized
- [ ] Verify stylistic consistency with RegisterView

### Step 7: Verify Error Handling in Axios Interceptor

**Location:** `frontend/src/api/axios.ts`

**Status:** ✅ Interceptor already exists and handles all cases

**Tasks:**

- [x] Handle 409 Conflict error - ✅ Implemented via `mapErrorToI18nKey`
- [x] Display toast notifications - ✅ Implemented via `useNotifications`
- [x] Handle detailed validation errors (400) - ✅ Implemented via `extractValidationErrors`
- [x] `uiStore.stopLoading()` on errors - ✅ Implemented
- [ ] Add i18n keys for registration errors (if missing)
- [ ] Test different error scenarios (400, 409, 500, network)

### Step 8: Unit Tests (Vitest)

**Location:** `frontend/src/features/authentication/__tests__/`

**Tasks:**

- [ ] Create `RegisterForm.spec.ts`
- [ ] Test: form renders with all fields
- [ ] Test: username validation (required, max length, no spaces)
- [ ] Test: password validation (required, min length)
- [ ] Test: emit submit event with correct data
- [ ] Test: button disabled when `isFormValid` returns false
- [ ] Test: button enabled when all conditions are met
- [ ] Create `RegisterView.spec.ts`
- [ ] Test: renders RegisterForm component
- [ ] Test: calls `authStore.register` on submit
- [ ] Test: redirects to `/` after successful registration
- [ ] Mock `useAuthStore` and `useRouter`

### Step 9: E2E Tests (Cypress)

**Location:** `frontend/cypress/e2e/`

**Tasks:**

- [ ] Create `register.cy.ts`
- [ ] Test: successful registration with valid data
- [ ] Test: display validation errors for empty fields
- [ ] Test: display error for password too short
- [ ] Test: display error for username with spaces
- [ ] Test: display error for existing username (409)
- [ ] Test: clicking login link redirects to `/login`
- [ ] Test: redirect to `/` for authenticated users

### Step 10: Accessibility Verification

**Tasks:**

- [ ] Check all fields have appropriate labels
- [ ] Verify ARIA attributes for validation errors
- [ ] Test keyboard navigation (Tab, Enter)
- [ ] Check focus management (autofocus on first field)
- [ ] Verify color contrast for error messages
- [ ] Test with screen reader (optional)

### Step 11: Manual Testing and QA

**Tasks:**

- [ ] Test successful registration
- [ ] Test all error scenarios (400, 409, 500, network)
- [ ] Verify automatic login after registration
- [ ] Check token and user are saved in localStorage
- [ ] Test real-time validation
- [ ] Verify behavior in different browsers
- [ ] Check responsiveness on different screen sizes
- [ ] Test interface language switching

### Step 12: Code Review and Documentation

**Tasks:**

- [ ] Code review by another developer
- [ ] Check compliance with guidelines (Vue, TypeScript, ESLint)
- [ ] Ensure code is well commented
- [ ] Update README.md (if needed)
- [ ] Create PR with change description
- [ ] Merge after approval

---

## Additional Notes

### Security

- Never send password in query parameters or URL
- Always use HTTPS in production
- JWT token should be stored securely (localStorage or httpOnly cookie)
- Implement rate limiting at API level (backend)

### UX Improvements (beyond MVP)

- Password strength indicator
- Confirm password field
- Show/hide password toggle (eye icon)
- Real-time username availability check
- Transition animations for better UX

### Performance

- Lazy loading of RegisterView
- Debounce for real-time validation (if asynchronous)
- Optimize re-renders using computed properties

### Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
