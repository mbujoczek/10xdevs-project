# Dashboard View Implementation Plan

## 1. Overview

The Dashboard View serves as the central hub for authenticated users after logging in. It provides quick access to core functionalities of the AI Flashcard Generator application, including starting a learning session, generating new flashcards, and managing existing flashcards. The view displays a welcome message with the user's username and a summary of due flashcards for review. The main action button "Start Learning" is dynamically enabled only when flashcards are due for review, providing clear visual feedback about the availability of learning opportunities.

## 2. View Routing

**Path:** `/` (Home)  
**Route Name:** `dashboard`  
**Component:** `DashboardView.vue`  
**Location:** `frontend/src/features/dashboard/views/DashboardView.vue`

**Route Configuration:**

```typescript
{
  path: '/',
  name: 'dashboard',
  component: () => import('@/features/dashboard/views/DashboardView.vue'),
  meta: { requiresAuth: true }
}
```

**Security:** This route must be protected and accessible only to authenticated users. The router's `beforeEach` guard should check for a valid JWT token and redirect unauthenticated users to `/login`.

## 3. Component Structure

```
DefaultLayout.vue (Layout)
├── AppHeader (Navigation Component)
│   ├── v-app-bar (Vuetify)
│   │   ├── Logo/App Name
│   │   ├── Navigation Links (Dashboard, My Flashcards, Generate, Statistics)
│   │   ├── LanguageSwitcher
│   │   └── Logout Button
└── v-main
    └── router-view
        └── DashboardView.vue (Container)
            ├── v-container (Vuetify)
            │   ├── v-row
            │   │   └── v-col
            │   │       └── v-card (Welcome Card)
            │   │           ├── v-card-title (Welcome message)
            │   │           └── v-card-text
            │   │               └── DashboardStats (Child Component)
            │   └── v-row
            │       └── v-col
            │           └── v-card (Actions Card)
            │               └── v-card-text
            │                   └── DashboardActions (Child Component)
            └── (Composed with: useAuthStore, useLearningStore, useRouter, useI18n)
```

**Feature Module Structure:**

```
frontend/src/
├── layouts/
│   ├── DefaultLayout.vue
│   └── AuthLayout.vue
├── components/
│   ├── AppHeader.vue
│   ├── LanguageSwitcher.vue
│   └── base/
│       ├── BaseButton.vue
│       └── BaseInput.vue
└── features/
    └── dashboard/
        ├── views/
        │   └── DashboardView.vue
        ├── components/
        │   ├── DashboardStats.vue
        │   └── DashboardActions.vue
        └── composables/
            └── useDashboard.ts
```

## 4. Component Details

### 4.1. DefaultLayout.vue

**Description:**  
The main layout wrapper for all authenticated views. Contains the persistent navigation header and a main content area where the router view is rendered. This layout is applied to all routes with `meta: { requiresAuth: true }`.

**Main HTML Elements & Child Components:**

- `v-app` - Vuetify application wrapper
- `AppHeader` - Navigation component with app bar
- `v-main` - Main content area
- `router-view` - Renders the current route's component

**Handled Events:**

- None (delegates navigation to child components)

**Validation Conditions:**

- None

**Required Types:**

- None

**Props:**

- None (root layout component)

---

### 4.2. AuthLayout.vue

**Description:**  
A simplified layout for authentication views (Login and Register). Contains only the form content without navigation, providing a clean interface for authentication flows.

**Main HTML Elements & Child Components:**

- `v-app` - Vuetify application wrapper
- `v-main` - Main content area
- `router-view` - Renders the current route's component (LoginView or RegisterView)

**Handled Events:**

- None

**Validation Conditions:**

- None

**Required Types:**

- None

**Props:**

- None (root layout component)

---

### 4.3. AppHeader.vue

**Description:**  
The navigation header component displayed in DefaultLayout. Contains the application logo, navigation links to main features, language switcher, and logout functionality. Uses Vuetify's `v-app-bar` for consistent Material Design styling.

**Main HTML Elements & Child Components:**

- `v-app-bar` with `app` prop for fixed positioning
- `v-toolbar-title` for logo/app name
- `v-btn` components for navigation links (using `router-link` or @click with programmatic navigation)
- `LanguageSwitcher` component
- `BaseButton` for logout action

**Handled Events:**

- **@click on Logout button:** Calls `authStore.logout()` and redirects to `/login`
- **Navigation link clicks:** Navigate to respective routes using Vue Router

**Validation Conditions:**

- None

**Required Types:**

- None

**Props:**

- None

**Composition API Usage:**

- `useAuthStore()` - Access logout action
- `useRouter()` - Programmatic navigation
- `useI18n()` - Access translations for navigation labels

---

### 4.4. LanguageSwitcher.vue

**Description:**  
A component that allows users to switch between Polish (PL) and English (EN) interface languages. Displays as a compact toggle or dropdown in the header. Persists language choice to localStorage.

**Main HTML Elements & Child Components:**

- `v-btn-toggle` or `v-select` for language selection
- Display flags or language codes (PL/EN)

**Handled Events:**

- **@update:modelValue:** Changes the application locale and saves to localStorage

**Validation Conditions:**

- None

**Required Types:**

```typescript
type SupportedLocale = 'pl' | 'en';
```

**Props:**

- None

**Composition API Usage:**

- `useI18n()` - Access and update current locale
- `watch` - Monitor locale changes to persist to localStorage

---

### 4.5. DashboardView.vue (Main Container)

**Description:**  
The main container component that serves as the entry point for the dashboard. It orchestrates the dashboard layout, fetches due flashcards data on mount, and manages the overall state. The component uses Vuetify's grid system for responsive layout and delegates specific functionalities to child components.

**Main HTML Elements & Child Components:**

- `v-container` with `fluid` prop for full-width layout
- `v-row` and `v-col` components for grid-based layout
- `v-card` components for visual grouping of welcome and actions sections
- `DashboardStats` component to display due flashcard statistics
- `DashboardActions` component to render action buttons

**Handled Events:**

- **Component Lifecycle:** `onMounted` - Triggers fetching of due flashcards count from the API
- **Navigation Events:** Responds to navigation actions triggered by `DashboardActions` component

**Validation Conditions:**

- None (display-only component with no form inputs)

**Required Types:**

- `DueFlashcardsResponse` from `@/types/learning.types.ts`
- `User` from `@/types/auth.types.ts`

**Props:**

- None (root view component)

**Composition API Usage:**

- `useAuthStore()` - Access authenticated user information
- `useLearningStore()` - Access and manage learning state (due flashcards)
- `useRouter()` - Handle programmatic navigation
- `useI18n()` - Access internationalization functions
- `useDashboard()` - Custom composable for dashboard-specific logic

---

### 4.6. DashboardStats.vue

**Description:**  
A presentational component responsible for displaying statistics about due flashcards. It shows the total count of flashcards awaiting review and provides visual feedback to the user about their learning progress. The component is purely presentational and receives all data via props.

**Main HTML Elements & Child Components:**

- `v-card-text` wrapper with typography classes
- `div` elements with Vuetify typography classes (`text-h3`, `text-body-1`)
- Conditional rendering using `v-if` to display different messages based on flashcard count

**Handled Events:**

- None (purely presentational component)

**Validation Conditions:**

- None (display-only component)

**Required Types:**

- `number` for `dueCount` prop

**Props:**

```typescript
interface Props {
  dueCount: number;
}
```

**Display Logic:**

- If `dueCount === 0`: Display message "No flashcards due for review"
- If `dueCount > 0`: Display count with text "flashcard(s) due for review"

---

### 4.7. DashboardActions.vue

**Description:**  
A component that renders the main action buttons for the dashboard. It provides navigation to key features: starting a learning session, generating new flashcards, and viewing all flashcards. The "Start Learning" button is conditionally disabled based on whether flashcards are due for review, providing clear UX feedback.

**Main HTML Elements & Child Components:**

- `v-row` with spacing utilities (`class="ga-4"` for gap)
- `v-col` with responsive breakpoints (`cols="12"`, `sm="4"`)
- Multiple `BaseButton` components for each action

**Handled Events:**

- **@click on "Start Learning" button:** Emits `start-learning` event to parent
- **@click on "Generate Flashcards" button:** Emits `generate-flashcards` event to parent
- **@click on "My Flashcards" button:** Emits `view-flashcards` event to parent

**Validation Conditions:**

- **Button Disabled State:** "Start Learning" button is disabled when `hasDueFlashcards === false`

**Required Types:**

- `boolean` for `hasDueFlashcards` prop

**Props:**

```typescript
interface Props {
  hasDueFlashcards: boolean;
}
```

**Emits:**

```typescript
const emit = defineEmits<{
  'start-learning': [];
  'generate-flashcards': [];
  'view-flashcards': [];
}>();
```

**Button Configuration:**

- **Start Learning:**

  - Color: `primary`
  - Size: `large`
  - Block: `true`
  - Disabled: `!hasDueFlashcards`
  - Icon: Optional (e.g., `mdi-play`)

- **Generate Flashcards:**

  - Color: `secondary`
  - Size: `large`
  - Block: `true`
  - Variant: `outlined`

- **My Flashcards:**
  - Color: `primary`
  - Size: `large`
  - Block: `true`
  - Variant: `text`

---

## 5. Types

### 5.1. Existing Types (Already Defined)

**From `@/types/learning.types.ts`:**

```typescript
export interface DueFlashcardsResponse {
  flashcards: Flashcard[];
  totalDueCount: number;
}
```

**From `@/types/auth.types.ts`:**

```typescript
export interface User {
  id: number;
  username: string;
}
```

**From `@/types/flashcards.types.ts`:**

```typescript
export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  source: FlashcardSource;
  status: FlashcardStatus;
  srsInterval: number | null;
  srsRepetitions: number | null;
  srsEaseFactor: number | null;
  srsNextRepetitionDate: string | null;
  srsLastGrade: SRSGrade | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}
```

### 5.2. New Types Required

**None.** All required types already exist in the codebase. The dashboard view will utilize existing types from `learning.types.ts`, `flashcards.types.ts`, and `auth.types.ts`.

---

## 6. State Management

### 6.1. Pinia Store: `useLearningStore`

**Location:** `frontend/src/features/learning/store.ts`

**Purpose:**  
Manages the state related to learning sessions, including due flashcards, current learning session state, and SRS algorithm data. This store will be created as part of the learning feature module.

**State:**

```typescript
const dueFlashcards = ref<Flashcard[]>([]);
const totalDueCount = ref<number>(0);
```

**Getters:**

```typescript
const hasDueFlashcards = computed(() => totalDueCount.value > 0);
```

**Actions:**

```typescript
const getDueFlashcards = async (): Promise<void> => {
  const response = await getDueFlashcards();
  dueFlashcards.value = response.flashcards;
  totalDueCount.value = response.totalDueCount;
};

const resetLearningState = () => {
  dueFlashcards.value = [];
  totalDueCount.value = 0;
};
```

**Note:** Loading state is automatically managed by axios interceptors through `useUiStore()`. No need to manually track loading state in this store.

**Usage in Dashboard:**

- The `DashboardView` will call `getDueFlashcards()` in the `onMounted` lifecycle hook
- The view will access `totalDueCount` to display statistics
- The view will access `hasDueFlashcards` getter to conditionally enable/disable the "Start Learning" button

### 6.2. Existing Store: `useAuthStore`

**Location:** `frontend/src/features/authentication/store.ts`

**Usage:**

- Access `user` computed property to display the welcome message with username
- Access `isAuthenticated` to verify user authentication status
- Call `logout()` action when user clicks logout button (handled in navigation bar, not in dashboard)

### 6.3. Existing Store: `useUiStore`

**Location:** `frontend/src/store/ui.store.ts`

**Usage:**

- The global loading state is automatically managed by axios interceptors
- No direct interaction needed from the dashboard view

---

## 7. API Integration

### 7.1. API Module

**Location:** `frontend/src/api/learning.api.ts` (new file)

**Function:**

```typescript
import type { DueFlashcardsResponse } from '@/types/learning.types';
import api from './axios';

export const getDueFlashcards = async (): Promise<DueFlashcardsResponse> => {
  const response = await api.get<DueFlashcardsResponse>('/learning/due');
  return response.data;
};
```

**Note:** The function is named `getDueFlashcards` to distinguish it from the store action `getDueFlashcards`.

**HTTP Details:**

- **Method:** `GET`
- **Endpoint:** `/api/learning/due`
- **Authentication:** Required (Bearer token automatically injected by axios interceptor)
- **Request Body:** None
- **Response Type:** `DueFlashcardsResponse`

### 7.2. Request/Response Flow

**Request:**

- No request body or query parameters required
- JWT token automatically included in `Authorization` header via axios interceptor

**Response (200 OK):**

```typescript
{
  flashcards: Flashcard[],
  totalDueCount: number
}
```

**Example Response:**

```json
{
  "flashcards": [
    {
      "id": 101,
      "question": "What is the capital of France?",
      "answer": "Paris",
      "source": 0,
      "status": 1,
      "srsInterval": 3,
      "srsRepetitions": 3,
      "srsEaseFactor": 2.5,
      "srsNextRepetitionDate": "2025-12-30T10:00:00Z",
      "srsLastGrade": 4,
      "createdAtUtc": "2025-12-20T10:00:00Z",
      "updatedAtUtc": "2025-12-27T10:00:00Z"
    }
  ],
  "totalDueCount": 1
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token (handled by axios interceptor, redirects to login)

### 7.3. Integration in Dashboard

**Flow:**

1. User navigates to `/` (Dashboard)
2. `DashboardView` component mounts
3. `onMounted` lifecycle hook calls `learningStore.getDueFlashcards()`
4. Store action calls `getDueFlashcards()` API function
5. Axios interceptor adds JWT token to request headers
6. Axios interceptor triggers global loading state via `useUiStore` (automatically)
7. API responds with `DueFlashcardsResponse`
8. Store updates `dueFlashcards` and `totalDueCount` state
9. UI reactively updates to display current statistics
10. Axios interceptor stops global loading state (automatically)

---

## 8. User Interactions

### 8.1. Initial Page Load

**Trigger:** User navigates to `/` or is redirected after login  
**Expected Behavior:**

1. Global loading overlay appears (managed by axios interceptor)
2. Dashboard fetches due flashcards count from API
3. Welcome message displays with user's username from auth store
4. Statistics section displays the count of due flashcards
5. Action buttons render with appropriate enabled/disabled states
6. Global loading overlay disappears

### 8.2. Start Learning Button Click

**Precondition:** `hasDueFlashcards === true`  
**Trigger:** User clicks "Start Learning" button  
**Expected Behavior:**

1. Router navigates to `/learn` (Learning Session View)
2. Learning session begins with the first due flashcard

**Precondition:** `hasDueFlashcards === false`  
**Trigger:** User attempts to click "Start Learning" button  
**Expected Behavior:**

1. Button is disabled (non-interactive)
2. Visual indication (grayed out) shows button is unavailable
3. Tooltip or helper text may indicate "No flashcards due for review"

### 8.3. Generate Flashcards Button Click

**Trigger:** User clicks "Generate Flashcards" button  
**Expected Behavior:**

1. Router navigates to `/generate` (Generate Flashcards View)
2. User can input text for AI-powered flashcard generation

### 8.4. My Flashcards Button Click

**Trigger:** User clicks "My Flashcards" button  
**Expected Behavior:**

1. Router navigates to `/flashcards` (Flashcards List View)
2. User can view, edit, and delete existing flashcards

### 8.5. Logout Button Click (Navigation Bar)

**Trigger:** User clicks "Logout" button in navigation bar  
**Expected Behavior:**

1. `authStore.logout()` is called
2. JWT token is removed from localStorage
3. User object is cleared from store
4. Router redirects to `/login`

### 8.6. Language Switch (Navigation Bar)

**Trigger:** User clicks language switcher in navigation bar  
**Expected Behavior:**

1. Application locale changes (PL ↔ EN)
2. All UI text updates immediately via vue-i18n
3. Language preference is saved to localStorage
4. Dashboard text (welcome message, button labels) updates to selected language

---

## 9. Conditions and Validation

### 9.1. Route Access Condition

**Condition:** User must be authenticated  
**Validation Point:** Router `beforeEach` guard  
**Implementation:**

```typescript
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken');
  const isAuthenticated = !!token;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/login' });
  } else {
    next();
  }
});
```

**UI Impact:** Unauthenticated users are redirected to `/login` before dashboard renders

### 9.2. "Start Learning" Button Enabled State

**Condition:** At least one flashcard is due for review  
**Validation Point:** `DashboardActions` component  
**Evaluated Expression:** `hasDueFlashcards` (computed from `totalDueCount > 0`)  
**Component:** `DashboardActions.vue`  
**UI Impact:**

- When `hasDueFlashcards === false`:
  - Button displays with `disabled` attribute
  - Button appears grayed out (Vuetify default disabled styling)
  - Optional: Tooltip displays "No flashcards due for review"
- When `hasDueFlashcards === true`:
  - Button is fully interactive
  - Button displays with primary color styling
  - Clicking navigates to `/learn`

### 9.3. Data Freshness Condition

**Condition:** Due flashcards data must be current  
**Validation Point:** Component mount and potential refresh scenarios  
**Implementation:**

- Data is fetched in `onMounted` lifecycle hook
- If user returns to dashboard from other views, data may need refresh
- Consider implementing `onActivated` hook if using `keep-alive` for view caching
  **UI Impact:** Loading overlay during data fetch ensures user sees current data

### 9.4. API Error Condition

**Condition:** API request fails (network error, server error)  
**Validation Point:** Axios interceptor and store error handling  
**UI Impact:**

- Error notification displays via `useNotifications` composable
- Dashboard may display empty state or cached data
- "Start Learning" button remains disabled if data fetch fails

---

## 10. Error Handling

### 10.1. Authentication Errors (401 Unauthorized)

**Scenario:** JWT token is invalid or expired  
**Detection:** Axios response interceptor  
**Handling:**

1. Interceptor detects 401 status code
2. Calls `authStore.logout()` to clear local state
3. Redirects user to `/login`
4. Displays error notification: "Session expired. Please log in again."

**Implementation Location:** `frontend/src/api/axios.ts` interceptor

### 10.2. Network Errors

**Scenario:** No internet connection or server unreachable  
**Detection:** Axios request error or response error  
**Handling:**

1. Error caught in axios interceptor
2. Display error notification: "Unable to connect. Please check your internet connection."
3. Dashboard displays last known state or empty state
4. User can manually retry by refreshing page

**UI Fallback:** Display message in stats section indicating data could not be loaded

### 10.3. API Server Errors (500 Internal Server Error)

**Scenario:** Backend encounters unexpected error  
**Detection:** Axios response interceptor (status code 5xx)  
**Handling:**

1. Error caught in interceptor
2. Display error notification: "Something went wrong. Please try again later."
3. Log error to console for debugging
4. Dashboard displays empty state or cached data

### 10.4. Empty State Handling

**Scenario:** User has no flashcards at all (not just none due)  
**Detection:** `totalDueCount === 0` and potentially `dueFlashcards.length === 0`  
**Handling:**

1. Display stats section with "No flashcards due for review" message
2. "Start Learning" button is disabled
3. Encourage user to generate or create flashcards via visible "Generate Flashcards" button
4. Consider displaying helpful onboarding message for new users

**UI State:** Dashboard remains fully functional with clear call-to-action to create flashcards

### 10.5. Loading State Management

**Scenario:** API request is in progress  
**Detection:** `useUiStore().isLoading` state (managed by axios interceptor)  
**Handling:**

1. Global loading overlay displays over entire application
2. User cannot interact with UI during loading
3. Loading state automatically clears when request completes or fails

**Edge Case:** Multiple concurrent requests increment/decrement loading counter to prevent premature hiding

---

## 11. Implementation Steps

### Step 1: Create Layout Components

#### 1.1. Create DefaultLayout.vue

**File:** `frontend/src/layouts/DefaultLayout.vue`

Implement the main layout:

```vue
<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
```

#### 1.2. Create AuthLayout.vue

**File:** `frontend/src/layouts/AuthLayout.vue`

Implement the authentication layout:

```vue
<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
```

#### 1.3. Create AppHeader.vue

**File:** `frontend/src/components/AppHeader.vue`

Implement the navigation header:

- Use `v-app-bar` with `app` prop
- Add app logo/name with `v-toolbar-title`
- Add navigation buttons: Dashboard, My Flashcards, Generate, Statistics
- Include `LanguageSwitcher` component
- Add logout button that calls `authStore.logout()` and redirects to `/login`
- Use `useAuthStore`, `useRouter`, and `useI18n` composables
- Use Vuetify's `v-btn` with `to` prop for router-link navigation

#### 1.4. Create LanguageSwitcher.vue

**File:** `frontend/src/components/LanguageSwitcher.vue`

Implement language switcher:

- Use `v-btn-toggle` with two buttons (PL/EN) or `v-select`
- Get current locale from `useI18n()`
- On change: update `locale.value` and save to `localStorage.setItem('locale', newValue)`
- Load saved locale from localStorage on app initialization
- Use compact design suitable for header placement

### Step 2: Update Router Configuration

**File:** `frontend/src/router/index.ts`

Update routes to use layouts:

```typescript
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: () =>
            import('@/features/authentication/views/LoginView.vue'),
          meta: { requiresGuest: true },
        },
      ],
    },
    {
      path: '/register',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'register',
          component: () =>
            import('@/features/authentication/views/RegisterView.vue'),
          meta: { requiresGuest: true },
        },
      ],
    },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () =>
            import('@/features/dashboard/views/DashboardView.vue'),
        },
        // Future authenticated routes will be added here
      ],
    },
  ],
});
```

### Step 3: Set up Feature Module Structure

Create the directory structure for the dashboard feature:

```
frontend/src/features/dashboard/
├── views/
│   └── DashboardView.vue
├── components/
│   ├── DashboardStats.vue
│   └── DashboardActions.vue
└── composables/
    └── useDashboard.ts
```

### Step 4: Create Learning Store

**File:** `frontend/src/features/learning/store.ts`

Implement Pinia store with:

- State: `dueFlashcards`, `totalDueCount`, `isLoading`
- Getter: `hasDueFlashcards`
- Actions: `fetchDueFlashcards`, `resetLearningState`

Use `defineStore` with setup syntax following existing `authStore` pattern.

### Step 5: Create Learning API Module

**File:** `frontend/src/api/learning.api.ts`

Implement API function:

- `getDueFlashcards()` - Returns `Promise<DueFlashcardsResponse>`
- Use existing `api` axios instance
- Follow pattern from `auth.api.ts`

### Step 6: Create Custom Composable (Optional)

**File:** `frontend/src/features/dashboard/composables/useDashboard.ts`

Implement composable to encapsulate dashboard-specific logic:

```typescript
export const useDashboard = () => {
  const learningStore = useLearningStore();
  const authStore = useAuthStore();
  const router = useRouter();

  const initializeDashboard = async () => {
    await learningStore.getDueFlashcards();
  };

  const navigateToLearning = () => {
    router.push('/learn');
  };

  const navigateToGenerate = () => {
    router.push('/generate');
  };

  const navigateToFlashcards = () => {
    router.push('/flashcards');
  };

  return {
    initializeDashboard,
    navigateToLearning,
    navigateToGenerate,
    navigateToFlashcards,
    user: authStore.user,
    dueCount: computed(() => learningStore.totalDueCount),
    hasDueFlashcards: computed(() => learningStore.hasDueFlashcards),
  };
};
```

### Step 7: Implement DashboardStats Component

**File:** `frontend/src/features/dashboard/components/DashboardStats.vue`

- Accept `dueCount` prop (number)
- Use Vuetify typography classes for styling
- Implement conditional rendering for zero vs. positive count
- Add i18n keys for all displayed text

### Step 8: Implement DashboardActions Component

**File:** `frontend/src/features/dashboard/components/DashboardActions.vue`

- Accept `hasDueFlashcards` prop (boolean)
- Define three button click events: `start-learning`, `generate-flashcards`, `view-flashcards`
- Use `BaseButton` component for all buttons
- Configure button styling with Vuetify props (color, size, variant, block)
- Disable "Start Learning" button based on prop
- Add i18n keys for all button labels

### Step 9: Implement DashboardView Component

**File:** `frontend/src/features/dashboard/views/DashboardView.vue`

- Use `<script setup>` with TypeScript
- Import and use composables: `useDashboard`, `useI18n`
- Call `initializeDashboard()` in `onMounted` hook
- Render layout with Vuetify components:
  - `v-container` with `fluid` prop
  - `v-row` and `v-col` for responsive grid
  - `v-card` for visual grouping
- Render `DashboardStats` with `dueCount` prop
- Render `DashboardActions` with `hasDueFlashcards` prop
- Handle emitted events from `DashboardActions` to trigger navigation
- Add welcome message with `user.username` from auth store

### Step 10: Add Internationalization Keys

**Files:** `frontend/src/i18n/locales/en.json` and `pl.json`

Add translation keys for:

- **Dashboard:**
  - Welcome message: `dashboard.welcome`
  - Due count messages: `dashboard.dueCount`, `dashboard.noDue`
  - Button labels: `dashboard.actions.startLearning`, `dashboard.actions.generate`, `dashboard.actions.myFlashcards`
- **Navigation:**
  - App name: `app.name`
  - Nav links: `nav.dashboard`, `nav.myFlashcards`, `nav.generate`, `nav.statistics`
  - Logout: `nav.logout`

### Step 11: Verify Router Guard

Ensure the `beforeEach` guard in `router/index.ts` handles both `requiresAuth` and `requiresGuest` meta fields (should already be implemented from Step 2).

### Step 12: Manual Testing

1. **Layout and Navigation:**

   - Verify DefaultLayout renders with AppHeader on dashboard
   - Verify AuthLayout renders without header on login/register
   - Test all navigation links in header (Dashboard, My Flashcards, Generate, Statistics)
   - Test language switcher functionality
   - Test logout button (should clear auth and redirect to login)
   - Verify navigation is responsive on mobile/tablet/desktop

2. **Authentication Flow:**

   - Log in as a user
   - Verify redirect to dashboard (`/`) with DefaultLayout
   - Verify welcome message displays username
   - Verify header shows user navigation options

3. **Due Flashcards Display:**

   - Verify API call to `/api/learning/due` on mount
   - Check due count displays correctly
   - Verify loading overlay appears during fetch

4. **Button State:**

   - When `totalDueCount > 0`: "Start Learning" should be enabled
   - When `totalDueCount === 0`: "Start Learning" should be disabled
   - All other buttons should always be enabled

5. **Navigation:**

   - Click "Start Learning" → navigates to `/learn`
   - Click "Generate Flashcards" → navigates to `/generate`
   - Click "My Flashcards" → navigates to `/flashcards`

6. **Language Switch:**

   - Switch language to Polish → all text updates
   - Switch back to English → all text updates
   - Refresh page → language preference persists

7. **Error Scenarios:**
   - Simulate network error → error notification displays
   - Simulate 401 error → redirects to login
   - Simulate 500 error → error notification displays

### Step 13: Code Review and Refinement

- Ensure TypeScript types are correctly applied throughout
- Verify all components follow existing code conventions
- Check that Vuetify classes are used instead of custom CSS
- Ensure accessibility: proper ARIA labels, keyboard navigation
- Verify responsive design works on mobile, tablet, and desktop
- Confirm i18n coverage for all user-facing text
- Review error handling and edge cases

---

## Summary

The Dashboard View implementation provides a clean, user-friendly entry point to the application with clear navigation to all core features. The architecture follows Vue 3 best practices with Composition API, maintains separation of concerns through dedicated stores and API modules, and ensures type safety with TypeScript. The modular component structure allows for easy testing and future enhancements while maintaining consistency with the existing codebase.
