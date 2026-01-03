# Statistics View Implementation Plan

## 1. Overview

The Statistics View displays global AI flashcard generation quality metrics from all system users. It serves as a success tracking dashboard showing acceptance rates and whether the product meets its success metric (75% pure acceptance rate as defined in PRD). The view presents statistical data in a clear, easy-to-understand format, allowing authenticated users to monitor the overall effectiveness of the AI flashcard generation feature across the entire platform.

## 2. View Routing

**Path:** `/statistics`  
**Route Name:** `statistics`  
**Component:** `StatisticsView.vue`  
**Location:** `frontend/src/features/statistics/views/StatisticsView.vue`

**Route Configuration:**

```typescript
{
  path: '/statistics',
  name: 'statistics',
  component: () => import('@/features/statistics/views/StatisticsView.vue'),
  meta: { requiresAuth: true }
}
```

**Security:** This route must be protected and accessible only to authenticated users. The router's `beforeEach` guard should verify a valid JWT token and redirect unauthenticated users to `/login`.

## 3. Component Structure

```
DefaultLayout.vue (Layout)
├── AppHeader (Navigation Component)
│   └── Navigation Links (Dashboard, My Flashcards, Generate, Statistics)
└── v-main
    └── router-view
        └── StatisticsView.vue (Container)
            ├── v-container (Vuetify)
            │   ├── v-row
            │   │   └── v-col
            │   │       └── v-card (Page Header)
            │   │           └── v-card-title (Page Title)
            │   └── v-row
            │       └── v-col
            │           └── AcceptanceMetrics (Child Component)
            └── (Composed with: useStatisticsStore, useI18n)
```

**Feature Module Structure:**

```
frontend/src/
└── features/
    └── statistics/
        ├── views/
        │   └── StatisticsView.vue
        ├── components/
        │   ├── AcceptanceMetrics.vue
        │   └── MetricCard.vue
        ├── store.ts
        └── (no composables needed - store handles logic)
```

**API Module Structure:**

```
frontend/src/
└── api/
    └── statistics.api.ts (new file)
```

## 4. Component Details

### 4.1. StatisticsView.vue

**Description:**  
The main container view component for the Statistics page. Responsible for loading statistics data from the API on mount and passing it to the child component for display. Uses Vuetify's layout system for responsive design.

**Main HTML Elements & Child Components:**

- `v-container` with `max-width="60em"` for consistent layout width
- `v-row` and `v-col` for grid layout
- `v-card` for page header with title
- `AcceptanceMetrics` component to display the statistics data

**Handled Events:**

- None (child components are presentational)

**Validation Conditions:**

- None (data validation handled by API and TypeScript types)

**Required Types:**

- `GenerationAcceptanceResponse` from `@/types/statistics.types`

**Props:**

- None (root view component)

**Composition API Usage:**

```typescript
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStatisticsStore } from '@/features/statistics/store';
import AcceptanceMetrics from '@/features/statistics/components/AcceptanceMetrics.vue';

const { t } = useI18n();
const statisticsStore = useStatisticsStore();

onMounted(async () => {
  await statisticsStore.fetchGenerationAcceptance();
});
```

**State Access:**

- `statisticsStore.acceptanceData` - Contains the loaded statistics data
- `statisticsStore.isLoading` - Loading state (handled by axios interceptor, but can be used for conditional rendering)
- `statisticsStore.error` - Error state (handled by axios interceptor)

---

### 4.2. AcceptanceMetrics.vue

**Description:**  
A presentational component that receives statistics data via props and displays it using multiple `MetricCard` components. Arranges metrics in a responsive grid layout and highlights whether the success metric is met.

**Main HTML Elements & Child Components:**

- `v-row` with `dense` prop for compact spacing
- Multiple `v-col` elements (responsive breakpoints: cols="12" sm="6" md="4")
- `MetricCard` components for each metric
- `v-alert` to display success metric status (success or warning type based on `meetsSuccessMetric`)

**Handled Events:**

- None (purely presentational)

**Validation Conditions:**

- None (receives validated data from parent)

**Required Types:**

- `GenerationAcceptanceResponse` from `@/types/statistics.types`

**Props:**

```typescript
interface Props {
  data: GenerationAcceptanceResponse | null;
}
```

**Component Logic:**

The component should display:

1. Total candidates generated
2. Accepted without editing count
3. Accepted after editing count
4. Rejected count
5. Overall acceptance rate (formatted as percentage)
6. Pure acceptance rate (formatted as percentage)
7. Target rate (formatted as percentage)
8. Success metric status (alert showing whether `meetsSuccessMetric` is true/false)

**Conditional Rendering:**

- Display loading skeleton or empty state when `data` is null
- Use `v-alert` with `type="success"` when `meetsSuccessMetric` is true
- Use `v-alert` with `type="warning"` when `meetsSuccessMetric` is false

---

### 4.3. MetricCard.vue

**Description:**  
A reusable card component for displaying a single metric with a label, value, and optional icon. Provides consistent styling across all statistics.

**Main HTML Elements & Child Components:**

- `v-card` with elevation and padding
- `v-card-text` containing:
  - `div` with `text-subtitle-2` class for label
  - `div` with `text-h4` class for value
  - Optional `v-icon` for visual representation

**Handled Events:**

- None

**Validation Conditions:**

- None

**Required Types:**

```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}
```

**Props:**

- `label` (required) - The metric label (e.g., "Total Candidates")
- `value` (required) - The metric value (can be number or formatted string for percentages)
- `icon` (optional) - Vuetify icon name (e.g., 'mdi-check-circle')
- `color` (optional) - Color theme for the card border or icon

**Styling:**

- Use Vuetify's built-in classes for typography and spacing
- Apply subtle color coding for success/warning states if color prop is provided

---

## 5. Types

### 5.1. Existing Types

**GenerationAcceptanceResponse** (from `statistics.types.ts`):

```typescript
export interface GenerationAcceptanceResponse {
  totalCandidates: number; // Total number of AI-generated flashcard candidates
  acceptedWithoutEditing: number; // Count of candidates accepted as-is
  acceptedAfterEditing: number; // Count of candidates accepted after user modifications
  rejected: number; // Count of candidates rejected by users
  acceptanceRate: number; // (acceptedWithoutEditing + acceptedAfterEditing) / totalCandidates
  pureAcceptanceRate: number; // acceptedWithoutEditing / totalCandidates (PRD success metric)
  meetsSuccessMetric: boolean; // Whether pureAcceptanceRate >= targetRate
  targetRate: number; // The target rate (0.75 or 75%)
}
```

### 5.2. New Types Required

**MetricCardProps** (inline type definition in MetricCard.vue):

```typescript
interface MetricCardProps {
  label: string; // Display label for the metric
  value: string | number; // Metric value (raw number or formatted string)
  icon?: string; // Optional Vuetify icon name
  color?: string; // Optional color theme
}
```

**AcceptanceMetricsProps** (inline type definition in AcceptanceMetrics.vue):

```typescript
interface Props {
  data: GenerationAcceptanceResponse | null;
}
```

### 5.3. Store State Types

```typescript
interface StatisticsState {
  acceptanceData: GenerationAcceptanceResponse | null;
}
```

## 6. State Management

**Store:** `features/statistics/store.ts`  
**Store Name:** `statisticsStore`

The store manages the state for statistics data fetched from the API. It follows the established pattern of using Pinia with the Composition API (setup syntax).

**State:**

```typescript
{
  acceptanceData: GenerationAcceptanceResponse | null;
}
```

**Getters:**

- `hasData: boolean` - Returns true if acceptanceData is not null
- `formattedAcceptanceRate: string` - Returns acceptanceRate as percentage (e.g., "79.2%")
- `formattedPureAcceptanceRate: string` - Returns pureAcceptanceRate as percentage
- `formattedTargetRate: string` - Returns targetRate as percentage

**Actions:**

- `fetchGenerationAcceptance(): Promise<void>` - Calls the API to fetch statistics data and updates state
- `resetState(): void` - Resets acceptanceData to null (useful for cleanup)

**Store Implementation Pattern:**

The store should follow the existing pattern from other feature stores (auth, learning, etc.):

- Use `defineStore` with setup function syntax
- Use `ref` for reactive state
- Use `computed` for getters
- Handle errors through axios interceptor (no manual error state needed)
- Loading state is managed globally by axios interceptor

## 7. API Integration

**New API Module:** `frontend/src/api/statistics.api.ts`

**Function:**

```typescript
export const getGenerationAcceptance = async (): Promise<GenerationAcceptanceResponse>
```

**Implementation:**

```typescript
import type { GenerationAcceptanceResponse } from '@/types/statistics.types';
import api from './axios';

export const getGenerationAcceptance =
  async (): Promise<GenerationAcceptanceResponse> => {
    const response = await api.get<GenerationAcceptanceResponse>(
      '/statistics/generation-acceptance'
    );
    return response.data;
  };
```

**HTTP Details:**

- **Method:** GET
- **Endpoint:** `/api/statistics/generation-acceptance`
- **Authentication:** Required (Bearer token automatically attached by axios interceptor)
- **Request Body:** None
- **Response Type:** `GenerationAcceptanceResponse`

**Success Response (200):**

```json
{
  "totalCandidates": 120,
  "acceptedWithoutEditing": 70,
  "acceptedAfterEditing": 25,
  "rejected": 25,
  "acceptanceRate": 0.792,
  "pureAcceptanceRate": 0.583,
  "meetsSuccessMetric": true,
  "targetRate": 0.75
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token (handled by axios interceptor)
- `500 Internal Server Error` - Server error (handled by axios interceptor)

**Integration Flow:**

1. `StatisticsView.vue` mounts
2. Calls `statisticsStore.fetchGenerationAcceptance()` in `onMounted` hook
3. Store action calls `getGenerationAcceptance()` from API module
4. Axios interceptor shows global loading overlay
5. On success, store updates `acceptanceData` with response
6. Axios interceptor hides loading overlay
7. Component reactively displays updated data via `AcceptanceMetrics` child component
8. On error, axios interceptor shows error notification (no additional handling needed)

## 8. User Interactions

### 8.1. Page Load

**Trigger:** User navigates to `/statistics` route  
**Action:** Component mounts and fetches data  
**Expected Result:**

- Global loading overlay appears (managed by axios interceptor)
- API request is sent to `/api/statistics/generation-acceptance`
- On success: Statistics data is displayed in metric cards
- On error: Global error notification appears (managed by axios interceptor)

### 8.2. Data Display

**Trigger:** Successful API response  
**Action:** Component receives data via store  
**Expected Result:**

- Multiple metric cards display:
  - Total candidates count
  - Accepted without editing count
  - Accepted after editing count
  - Rejected count
  - Acceptance rate (as percentage)
  - Pure acceptance rate (as percentage)
  - Target rate (as percentage)
- Success/warning alert displays based on `meetsSuccessMetric`:
  - Green success alert if metric is met
  - Yellow warning alert if metric is not met

### 8.3. Navigation

**Trigger:** User clicks navigation links in AppHeader  
**Action:** Vue Router navigates to selected route  
**Expected Result:**

- User can navigate away to Dashboard, Generate, or Flashcards views
- Statistics data remains cached in store (no refetch needed unless manually refreshed)

### 8.4. Language Switch

**Trigger:** User changes language via LanguageSwitcher  
**Action:** i18n locale updates  
**Expected Result:**

- All labels and text content update to selected language (PL/EN)
- Metric values remain unchanged (numbers and percentages)

## 9. Conditions and Validation

### 9.1. Authentication

**Component Affected:** StatisticsView.vue (and all authenticated views)  
**Condition:** User must have valid JWT token  
**Verification:** Router `beforeEach` guard checks `authStore.isAuthenticated`  
**Impact on UI:**

- If not authenticated: Redirect to `/login`
- If authenticated: Allow access to view

### 9.2. Data Availability

**Component Affected:** AcceptanceMetrics.vue  
**Condition:** `data` prop must not be null to display metrics  
**Verification:** Check `if (data === null)` in template  
**Impact on UI:**

- If null: Display loading skeleton or empty state message
- If present: Display metric cards with data

### 9.3. Success Metric Status

**Component Affected:** AcceptanceMetrics.vue  
**Condition:** `meetsSuccessMetric` boolean determines alert type  
**Verification:** Check `data.meetsSuccessMetric` value  
**Impact on UI:**

- If true: Display `v-alert` with `type="success"` and success message
- If false: Display `v-alert` with `type="warning"` and warning message

### 9.4. Percentage Formatting

**Component Affected:** AcceptanceMetrics.vue and MetricCard.vue  
**Condition:** Rate values (0-1 decimal) should be displayed as percentages  
**Verification:** Format in getter or component logic  
**Impact on UI:**

- Convert 0.792 to "79.2%"
- Convert 0.583 to "58.3%"
- Convert 0.75 to "75%"

## 10. Error Handling

### 10.1. API Request Failure

**Scenario:** `/api/statistics/generation-acceptance` endpoint returns error (401, 500, etc.)  
**Handling:**

- Axios interceptor automatically displays global error notification
- No additional error handling needed in component or store
- User remains on Statistics view with empty/loading state

**User Experience:**

- Error notification appears at top of screen
- User can try refreshing the page to retry

### 10.2. Invalid Token

**Scenario:** JWT token is expired or invalid  
**Handling:**

- API returns 401 Unauthorized
- Axios interceptor handles token refresh or logout
- User is redirected to login page if token cannot be refreshed

**User Experience:**

- Seamless redirect to login
- User must re-authenticate

### 10.3. Empty Data

**Scenario:** API returns valid response but with zero candidates (all values are 0)  
**Handling:**

- Display metrics normally with zero values
- Show informational message indicating no data has been collected yet

**User Experience:**

- Metrics display "0" values
- Optional message: "No flashcard generation data available yet"

### 10.4. Network Failure

**Scenario:** No internet connection or network timeout  
**Handling:**

- Axios interceptor catches network error
- Global error notification displays generic error message

**User Experience:**

- Error notification with retry suggestion
- User can manually refresh page to retry

## 11. Implementation Steps

### Step 1: Create Type Definitions

If not already present, ensure `statistics.types.ts` exists with the `GenerationAcceptanceResponse` interface.

**File:** `frontend/src/types/statistics.types.ts`

### Step 2: Create API Module

Create the API function for fetching generation acceptance statistics.

**File:** `frontend/src/api/statistics.api.ts`

**Tasks:**

- Import required types from `statistics.types.ts`
- Import axios instance from `./axios`
- Implement `getGenerationAcceptance()` function with proper typing

### Step 3: Create Pinia Store

Create the statistics store following established patterns.

**File:** `frontend/src/features/statistics/store.ts`

**Tasks:**

- Define store with `defineStore('statisticsStore', () => { ... })`
- Create reactive state: `acceptanceData`
- Create computed getters for formatted percentages
- Implement `fetchGenerationAcceptance()` action
- Implement `resetState()` action

### Step 4: Create Feature Directory Structure

Set up the statistics feature module structure.

**Tasks:**

- Create `frontend/src/features/statistics/` directory
- Create subdirectories: `views/`, `components/`
- Create `store.ts` in the feature root

### Step 5: Create MetricCard Component

Build the reusable metric display card.

**File:** `frontend/src/features/statistics/components/MetricCard.vue`

**Tasks:**

- Define props interface with label, value, icon, color
- Implement template using Vuetify's `v-card`
- Apply typography classes for label and value
- Add optional icon display

### Step 6: Create AcceptanceMetrics Component

Build the main statistics display component.

**File:** `frontend/src/features/statistics/components/AcceptanceMetrics.vue`

**Tasks:**

- Define props interface accepting `GenerationAcceptanceResponse | null`
- Implement responsive grid layout with `v-row` and `v-col`
- Create multiple `MetricCard` instances for each metric
- Implement success/warning alert based on `meetsSuccessMetric`
- Format rate values as percentages
- Handle null data state with conditional rendering

### Step 7: Create StatisticsView

Build the main view component.

**File:** `frontend/src/features/statistics/views/StatisticsView.vue`

**Tasks:**

- Import and use `useStatisticsStore` and `useI18n`
- Import `AcceptanceMetrics` child component
- Implement `onMounted` hook to fetch data
- Create template with `v-container`, header card, and `AcceptanceMetrics`
- Pass store data to child component via props

### Step 8: Add Route Configuration

Register the new route in Vue Router.

**File:** `frontend/src/router/index.ts`

**Tasks:**

- Add route object with path `/statistics`, name `statistics`, lazy-loaded component
- Set `meta: { requiresAuth: true }`
- Ensure route is within authenticated routes section

### Step 9: Update Navigation

Add Statistics link to the main navigation.

**File:** `frontend/src/components/AppHeader.vue` (or equivalent)

**Tasks:**

- Add navigation button/link to Statistics view
- Use `router-link` or `@click` with programmatic navigation
- Add translation key for "Statistics" label

### Step 10: Add Translation Keys

Add i18n translation keys for all text content.

**Files:**

- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/pl.json`

**Tasks:**

- Add keys for page title
- Add keys for each metric label
- Add keys for success/warning messages
- Add keys for navigation link

### Step 11: Test Data Flow

Verify the complete implementation works end-to-end.

**Tasks:**

- Navigate to `/statistics` while authenticated
- Verify API call is made
- Verify loading overlay appears and disappears
- Verify data displays correctly in metric cards
- Verify percentages are properly formatted
- Verify success/warning alert displays correctly
- Test language switching
- Test navigation to/from the page

### Step 12: Test Error Scenarios

Ensure error handling works as expected.

**Tasks:**

- Test with invalid/expired token (should redirect to login)
- Test with network disconnected (should show error notification)
- Test with API returning error response
- Verify error notifications appear via axios interceptor

### Step 13: Verify Accessibility

Ensure the view meets accessibility requirements.

**Tasks:**

- Verify all metrics have clear labels
- Test keyboard navigation
- Verify screen reader compatibility
- Check color contrast for success/warning alerts

### Step 14: Code Review and Refinement

Final review and cleanup.

**Tasks:**

- Ensure code follows project conventions
- Verify TypeScript types are correctly applied
- Check for any console errors or warnings
- Ensure consistent styling with other views
- Remove any unused imports or code
