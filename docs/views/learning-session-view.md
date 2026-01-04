# Implementation Plan for Learning Session View

## 1. Overview

The Learning Session View is a critical feature of the AI Flashcard Generator application that implements the spaced repetition learning workflow. It consists of two interconnected views:

1. **LearningSessionView** - The main learning interface where users review flashcards and rate their recall performance using a 6-point scale (0-5). The view presents one flashcard at a time, initially showing only the question, then revealing the answer upon user interaction, and finally accepting a rating that updates the SRS algorithm parameters.

2. **LearningSummaryView** - A summary screen displayed after completing a learning session, showing statistics about the session performance and providing navigation back to the dashboard.

These views implement the SM-2 spaced repetition algorithm workflow, where user ratings directly influence when flashcards will be shown again, optimizing the learning process based on recall difficulty.

## 2. View Routing

### LearningSessionView

- **Path:** `/learn`
- **Route Name:** `learn`
- **Parent Layout:** `DefaultLayout`
- **Authentication:** Required (`meta: { requiresAuth: true }`)
- **Lazy Loading:** Yes

### LearningSummaryView

- **Path:** `/learn/summary`
- **Route Name:** `learn-summary`
- **Parent Layout:** `DefaultLayout`
- **Authentication:** Required (`meta: { requiresAuth: true }`)
- **Lazy Loading:** Yes

**Note:** The router configuration needs to be updated to replace the current placeholder route for `/learn` with the actual component and add the summary route.

## 3. Component Structure

```
LearningSessionView.vue
├── v-container
    ├── EmptyState.vue (conditional - when no flashcards due)
    └── v-card (conditional - when flashcards available)
        ├── v-card-title (session progress indicator)
        ├── v-card-text
        │   ├── FlashcardDisplay.vue (custom component)
        │   │   ├── v-card (question display)
        │   │   └── v-card (answer display - conditional)
        │   └── RatingButtons.vue (custom component - conditional after answer revealed)
        └── v-card-actions (optional navigation controls)

LearningSummaryView.vue
├── v-container
    └── v-card
        ├── v-card-title (summary header)
        ├── v-card-text
        │   └── SessionStats.vue (custom component)
        │       ├── StatItem.vue (multiple instances)
        │       └── PerformanceBreakdown.vue (grade distribution)
        └── v-card-actions
            └── v-btn (navigate to dashboard)
```

## 4. Component Details

### 4.1. LearningSessionView.vue

**Purpose:** Main view component that orchestrates the learning session workflow, manages session state, handles flashcard navigation, and processes user ratings.

**Main Elements:**

- Outer `v-container` for responsive layout (max-width: 70em)
- Conditional rendering based on session state:
  - `EmptyState` component when no flashcards are due
  - Learning interface card when flashcards are available
- Session progress indicator showing current position (e.g., "5 / 12")
- `FlashcardDisplay` component for question/answer presentation
- `RatingButtons` component for user input
- Automatic navigation to summary view upon session completion

**Handled Events:**

- `onMounted`: Fetch due flashcards from the store
- `@show-answer`: Reveal answer and show rating buttons
- `@rate`: Submit rating to API, update local state, load next flashcard
- Automatic navigation when all flashcards are reviewed

**Validation Conditions:**

- Check if due flashcards exist before rendering learning interface
- Validate that current flashcard index is within bounds
- Ensure rating value is between 0-5 before submission
- Verify flashcard ID exists before API call

**Required Types:**

- `Flashcard` (from existing types)
- `SRSGrade` (enum, existing)
- `RateFlashcardRequest` (existing)
- `RateFlashcardResponse` (existing)
- `LearningSessionState` (new ViewModel type)

**Props:** None (root view component)

**Local State:**

- `currentIndex: number` - Index of currently displayed flashcard
- `isAnswerVisible: boolean` - Controls answer visibility
- `reviewedFlashcards: number[]` - Array of flashcard IDs that have been rated
- `sessionStats: SessionStatistics` - Accumulated statistics for summary

### 4.2. FlashcardDisplay.vue

**Purpose:** Presentational component responsible for displaying the flashcard question and conditionally showing the answer. Provides visual separation between question and answer states.

**Main Elements:**

- Question card (always visible):
  - `v-card` with elevation
  - `v-card-text` containing question text
  - Typography: `text-h5` or `text-h6` for readability
- "Show Answer" button (visible when answer is hidden):
  - `v-btn` with primary color
  - Full width or centered
  - Keyboard accessible (Enter key support)
- Answer card (conditionally visible):
  - `v-card` with distinct styling (different color/elevation)
  - `v-card-text` containing answer text
  - Smooth transition animation (fade or slide)

**Handled Events:**

- `@click` on "Show Answer" button: Emits `show-answer` event to parent

**Validation Conditions:**

- Question text must not be empty
- Answer text must not be empty

**Required Types:**

- `Flashcard` (existing)

**Props:**

```typescript
interface Props {
  flashcard: Flashcard;
  isAnswerVisible: boolean;
}
```

**Emits:**

```typescript
interface Emits {
  (e: 'show-answer'): void;
}
```

### 4.3. RatingButtons.vue

**Purpose:** Component that renders the 6-point rating scale (0-5) as interactive buttons. Each button represents a different level of recall difficulty according to SM-2 algorithm standards.

**Main Elements:**

- Container: `v-row` or `v-btn-group` for button layout
- Six `v-btn` elements, one for each grade (0-5)
- Each button displays:
  - Grade number
  - Optional descriptive label (e.g., "0 - Complete Blackout", "5 - Perfect")
  - Distinct visual styling (color coding: red for low, yellow for medium, green for high)
- Responsive layout (grid on mobile, inline on desktop)

**Handled Events:**

- `@click` on any rating button: Emits `rate` event with selected grade value

**Validation Conditions:**

- All buttons must be enabled (not disabled by default)
- Grade value must be integer between 0 and 5

**Required Types:**

- `SRSGrade` (enum, existing)

**Props:** None

**Emits:**

```typescript
interface Emits {
  (e: 'rate', grade: SRSGrade): void;
}
```

### 4.4. EmptyState.vue

**Purpose:** Reusable presentational component displayed when no flashcards are due for review. Provides user feedback and navigation options.

**Main Elements:**

- `v-card` container with centered content
- Icon: `v-icon` (e.g., `mdi-check-circle` or `mdi-sleep`)
- Title: `text-h5` - e.g., "All Caught Up!"
- Description text explaining no flashcards are due
- Action buttons:
  - Navigate to flashcards list
  - Navigate to generate new flashcards

**Handled Events:**

- `@click` on navigation buttons: Emits navigation events or uses router directly

**Validation Conditions:** None

**Required Types:** None

**Props:**

```typescript
interface Props {
  title?: string;
  description?: string;
  iconName?: string;
}
```

**Note:** This component may already exist in `@/features/flashcards/components/EmptyState.vue` and can be reused or extended.

### 4.5. LearningSummaryView.vue

**Purpose:** View component that displays a summary of the completed learning session, showing performance metrics and providing closure to the learning workflow.

**Main Elements:**

- Outer `v-container` for responsive layout (max-width: 70em)
- Main `v-card` container
- Header section with celebratory message
- `SessionStats` component displaying:
  - Total flashcards reviewed
  - Time spent (if tracked)
  - Distribution of ratings
  - Average performance
- Navigation button to return to dashboard

**Handled Events:**

- `onMounted`: Optionally validate that summary data exists
- `@click` on "Return to Dashboard": Navigate to dashboard, reset learning session state

**Validation Conditions:**

- Verify session statistics exist before rendering
- Handle case where user navigates directly to summary without completing session

**Required Types:**

- `SessionStatistics` (new ViewModel type)

**Props:** None (root view component, receives data from store or route state)

**Local State:**

- Session statistics can be passed via route params, stored in learning store, or reconstructed from route state

### 4.6. SessionStats.vue

**Purpose:** Presentational component that formats and displays learning session statistics in an organized, visually appealing layout.

**Main Elements:**

- Grid layout using `v-row` and `v-col`
- Multiple `StatItem` components or card-based stat displays
- Metrics shown:
  - Total flashcards reviewed (number)
  - Session duration (if tracked)
  - Rating breakdown (how many 0s, 1s, 2s, 3s, 4s, 5s)
  - Average rating (calculated)
- Optional visual representation (progress bars, charts)

**Handled Events:** None (purely presentational)

**Validation Conditions:**

- Handle zero values gracefully
- Calculate percentages safely (avoid division by zero)

**Required Types:**

- `SessionStatistics` (new ViewModel type)

**Props:**

```typescript
interface Props {
  statistics: SessionStatistics;
}
```

## 5. Types

### 5.1. Existing Types (from type definitions)

**Flashcard** (from `flashcards.types.ts`):

```typescript
interface Flashcard {
  id: number;
  question: string;
  answer: string;
  source: FlashcardSource;
  status: FlashcardStatus;
  srsInterval: number;
  srsRepetitions: number;
  srsEaseFactor: number;
  srsNextRepetitionDate: string;
  srsLastGrade?: SRSGrade;
  createdAtUtc: string;
  updatedAtUtc: string;
}
```

**SRSGrade** (from `enums.ts`):

```typescript
enum SRSGrade {
  CompleteBlackout = 0,
  IncorrectResponse = 1,
  IncorrectResponseRecalled = 2,
  CorrectWithDifficulty = 3,
  CorrectAfterHesitation = 4,
  PerfectResponse = 5,
}
```

**RateFlashcardRequest** (from `learning.types.ts`):

```typescript
interface RateFlashcardRequest {
  grade: SRSGrade;
  reviewedAtUtc?: string;
}
```

**RateFlashcardResponse** (from `learning.types.ts`):

```typescript
interface RateFlashcardResponse {
  id: number;
  srsInterval: number;
  srsRepetitions: number;
  srsEaseFactor: number;
  srsNextRepetitionDate: string;
  srsLastGrade: SRSGrade;
  updatedAtUtc: string;
}
```

**DueFlashcardsResponse** (from `learning.types.ts`):

```typescript
interface DueFlashcardsResponse {
  flashcards: Flashcard[];
  totalDueCount: number;
}
```

### 5.2. New ViewModel Types

**LearningSessionState** (to be created in `learning.types.ts`):

```typescript
interface LearningSessionState {
  currentIndex: number;
  totalCount: number;
  isAnswerVisible: boolean;
  completedCount: number;
}
```

Fields:

- `currentIndex: number` - Zero-based index of the currently displayed flashcard in the session array
- `totalCount: number` - Total number of flashcards in the current session
- `isAnswerVisible: boolean` - Whether the answer is currently revealed to the user
- `completedCount: number` - Number of flashcards that have been rated

**SessionStatistics** (to be created in `learning.types.ts`):

```typescript
interface SessionStatistics {
  totalReviewed: number;
  ratingDistribution: RatingDistribution;
  sessionDurationMs?: number;
}

interface RatingDistribution {
  [SRSGrade.CompleteBlackout]: number;
  [SRSGrade.IncorrectResponse]: number;
  [SRSGrade.IncorrectResponseRecalled]: number;
  [SRSGrade.CorrectWithDifficulty]: number;
  [SRSGrade.CorrectAfterHesitation]: number;
  [SRSGrade.PerfectResponse]: number;
}
```

Fields for `SessionStatistics`:

- `totalReviewed: number` - Total number of flashcards reviewed in the session
- `ratingDistribution: RatingDistribution` - Count of each rating grade (0-5) given during the session
- `sessionDurationMs?: number` - Optional duration of the session in milliseconds

Fields for `RatingDistribution`:

- Six numeric properties keyed by `SRSGrade` enum values, each representing the count of times that grade was assigned

**FlashcardRatingPayload** (internal type for event handling):

```typescript
interface FlashcardRatingPayload {
  flashcardId: number;
  grade: SRSGrade;
  timestamp: string;
}
```

Fields:

- `flashcardId: number` - ID of the flashcard being rated
- `grade: SRSGrade` - Rating grade (0-5) given by the user
- `timestamp: string` - ISO 8601 timestamp when the rating was given

## 6. State Management

### 6.1. Learning Store Updates

The existing `useLearningStore` (located at `@/features/learning/store.ts`) needs to be extended with additional functionality:

**New State Properties:**

- `sessionStatistics: SessionStatistics | null` - Statistics for the current/completed session
- `isSessionActive: boolean` - Flag indicating if a learning session is in progress

**New Actions:**

1. **`rateFlashcard(id: number, grade: SRSGrade): Promise<RateFlashcardResponse>`**

   - Makes API call to rate a flashcard
   - Removes rated flashcard from `dueFlashcards` array
   - Decrements `totalDueCount`
   - Updates `sessionStatistics` with the new rating
   - Returns the updated flashcard data

2. **`startSession(): void`**

   - Sets `isSessionActive = true`
   - Initializes `sessionStatistics` with zero values
   - Records session start time (if tracking duration)

3. **`endSession(): SessionStatistics`**

   - Sets `isSessionActive = false`
   - Calculates final session duration (if tracking)
   - Returns the completed `sessionStatistics`
   - Does not reset statistics (allows summary view to read them)

4. **`resetSessionStatistics(): void`**
   - Resets `sessionStatistics` to null
   - Called when user leaves the summary view

**Computed Properties:**

1. **`currentFlashcard: Flashcard | undefined`**

   - Returns the first flashcard in `dueFlashcards` array
   - Used by the view to determine which flashcard to show

2. **`sessionProgress: string`**
   - Returns formatted progress string (e.g., "3 / 10")
   - Calculated from `sessionStatistics.totalReviewed` and initial `totalDueCount`

### 6.2. Component-Level State

**LearningSessionView.vue:**

- `isAnswerVisible: boolean` - Controls whether answer is shown for current flashcard
- `isRating: boolean` - Prevents double-submission while rating is being processed
- Reset `isAnswerVisible` to `false` when moving to next flashcard

**LearningSummaryView.vue:**

- No component-level state required (reads from store)

### 6.3. State Flow

1. **Session Initialization:**

   - User navigates to `/learn`
   - `onMounted` → Check if `dueFlashcards` are loaded → If not, call `getDueFlashcards()`
   - Call `startSession()` to initialize session state
   - Render first flashcard

2. **During Session:**

   - User clicks "Show Answer" → Set `isAnswerVisible = true`
   - User clicks rating button → Call `rateFlashcard()` → Reset `isAnswerVisible = false` → Show next flashcard
   - If no more flashcards → Navigate to `/learn/summary`

3. **Session Summary:**
   - `LearningSummaryView` reads `sessionStatistics` from store
   - User clicks "Return to Dashboard" → Navigate to `/` → Call `resetSessionStatistics()`

## 7. API Integration

### 7.1. Existing API Functions

Located in `@/api/learning.api.ts`:

**`getDueFlashcards(): Promise<DueFlashcardsResponse>`**

- Already implemented
- Used by learning store's `getDueFlashcards()` action
- Called on view mount or when entering learning session

### 7.2. New API Functions

Add to `@/api/learning.api.ts`:

**`rateFlashcard(id: number, request: RateFlashcardRequest): Promise<RateFlashcardResponse>`**

- **Method:** POST
- **Endpoint:** `/learning/flashcards/{id}/rate`
- **Request Type:** `RateFlashcardRequest`
  - `grade: SRSGrade` (required, 0-5)
  - `reviewedAtUtc?: string` (optional, ISO 8601)
- **Response Type:** `RateFlashcardResponse`
  - `id: number`
  - `srsInterval: number`
  - `srsRepetitions: number`
  - `srsEaseFactor: number`
  - `srsNextRepetitionDate: string`
  - `srsLastGrade: SRSGrade`
  - `updatedAtUtc: string`
- **Error Handling:** Axios interceptor handles global errors (401, 403, 404, 400)
- **Loading State:** Managed by axios interceptor (global loading overlay)

**Implementation:**

```typescript
export const rateFlashcard = async (
  id: number,
  request: RateFlashcardRequest
): Promise<RateFlashcardResponse> => {
  const response = await api.post<RateFlashcardResponse>(
    `/learning/flashcards/${id}/rate`,
    request
  );
  return response.data;
};
```

### 7.3. API Call Flow

1. **Fetch due flashcards:**

   - Trigger: `LearningSessionView` mounted, or Dashboard displays due count
   - Store Action: `learningStore.getDueFlashcards()`
   - API: `getDueFlashcards()`

2. **Rate a flashcard:**
   - Trigger: User clicks rating button (0-5)
   - Component: `LearningSessionView` handles `@rate` event
   - Store Action: `learningStore.rateFlashcard(flashcardId, grade)`
   - API: `rateFlashcard(id, { grade })`
   - Post-Success: Remove flashcard from list, update stats, show next or navigate to summary

### 7.4. Error Handling

All error handling is managed by the existing axios interceptor:

- 401 Unauthorized: Redirects to login
- 403 Forbidden: Shows error notification (flashcard belongs to different user)
- 404 Not Found: Shows error notification (flashcard not found or deleted)
- 400 Bad Request: Shows validation error notification (invalid grade)

Loading state is also managed globally by the interceptor (displays loading overlay).

## 8. User Interactions

### 8.1. Starting a Learning Session

**Trigger:** User clicks "Start Learning" button on Dashboard
**Precondition:** `hasDueFlashcards === true`
**Flow:**

1. User navigates to `/learn`
2. View fetches due flashcards (if not already loaded)
3. View calls `startSession()` to initialize statistics
4. First flashcard question is displayed
5. Answer is hidden, "Show Answer" button is visible

**Edge Case:** If no flashcards are due, display `EmptyState` component instead

### 8.2. Revealing the Answer

**Trigger:** User clicks "Show Answer" button or presses Enter key
**Flow:**

1. `isAnswerVisible` is set to `true`
2. Answer card fades in with smooth transition
3. "Show Answer" button is hidden
4. Rating buttons (0-5) become visible below the answer

**Accessibility:** Ensure keyboard navigation works (Tab to button, Enter to activate)

### 8.3. Rating a Flashcard

**Trigger:** User clicks one of the rating buttons (0-5)
**Flow:**

1. Rating button click triggers `@rate` event with selected grade
2. View sets `isRating = true` to prevent double-submission
3. Store action `rateFlashcard(flashcardId, grade)` is called
4. API request is sent (loading overlay shown by interceptor)
5. On success:
   - Flashcard is removed from `dueFlashcards` array
   - `sessionStatistics` is updated with the rating
   - `isAnswerVisible` is reset to `false`
   - `isRating` is reset to `false`
   - Next flashcard is displayed automatically
6. If last flashcard: Navigate to `/learn/summary`

**Visual Feedback:**

- Rating buttons can show hover state
- Brief transition between flashcards (optional fade/slide)

**Error Handling:**

- If API fails, error notification is shown (handled by interceptor)
- Flashcard remains in the queue for retry

### 8.4. Completing a Session

**Trigger:** User rates the last flashcard in the session
**Flow:**

1. After last rating is processed, view detects `dueFlashcards.length === 0`
2. View calls `endSession()` to finalize statistics
3. View navigates to `/learn/summary` (can pass statistics via route state or store)
4. Summary view displays session performance metrics

### 8.5. Viewing Session Summary

**Trigger:** Automatic navigation after completing session
**Flow:**

1. User arrives at `/learn/summary`
2. View reads `sessionStatistics` from store (or route state)
3. Statistics are displayed in organized layout
4. User clicks "Return to Dashboard"
5. View navigates to `/`
6. View calls `resetSessionStatistics()` to clear session data

**Edge Case:** If user navigates directly to `/learn/summary` without completing a session:

- Display message: "No session data available"
- Provide button to return to dashboard

### 8.6. Keyboard Navigation

All interactive elements must be keyboard accessible:

- Tab: Navigate between buttons
- Enter/Space: Activate buttons
- Escape: (Optional) Exit session with confirmation

**Focus Management:**

- When answer is revealed, focus moves to first rating button
- After rating, focus returns to "Show Answer" button for next card

## 9. Conditions and Validation

### 9.1. View-Level Conditions

**LearningSessionView:**

1. **Display Empty State:**

   - **Condition:** `!learningStore.hasDueFlashcards`
   - **Component:** `EmptyState`
   - **Message:** "All caught up! You have no flashcards to review right now."

2. **Display Learning Interface:**

   - **Condition:** `learningStore.hasDueFlashcards && currentFlashcard !== undefined`
   - **Components:** `FlashcardDisplay`, `RatingButtons`

3. **Show Progress Indicator:**

   - **Condition:** `sessionStatistics.totalReviewed > 0`
   - **Display:** `"${sessionStatistics.totalReviewed} / ${initialTotalCount}"`
   - **Note:** Store initial `totalDueCount` in component to calculate progress

4. **Disable Rating During Submission:**
   - **Condition:** `isRating === true`
   - **Effect:** Disable all rating buttons to prevent double-submission

**LearningSummaryView:**

1. **Display Summary:**

   - **Condition:** `sessionStatistics !== null`
   - **Component:** `SessionStats`

2. **Display No Data Message:**
   - **Condition:** `sessionStatistics === null`
   - **Message:** "No session data available. Please complete a learning session first."

### 9.2. Component-Level Validation

**FlashcardDisplay:**

- **Question Validation:** `flashcard.question.trim().length > 0`
- **Answer Validation:** `flashcard.answer.trim().length > 0`
- If validation fails, display error message in place of content

**RatingButtons:**

- **Grade Range Validation:** Before emitting, verify `grade >= 0 && grade <= 5`
- **Enum Validation:** Use `SRSGrade` enum values to ensure type safety

### 9.3. API Request Validation

**rateFlashcard API Call:**

- **Flashcard ID:** Must be a positive integer
- **Grade:** Must be `SRSGrade` enum value (0-5)
- **reviewedAtUtc:** If provided, must be valid ISO 8601 string (optional, can be omitted)

**Frontend Validation Before API Call:**

```typescript
const isValidGrade = (grade: number): grade is SRSGrade => {
  return grade >= 0 && grade <= 5 && Number.isInteger(grade);
};

if (!isValidGrade(grade)) {
  console.error('Invalid grade value');
  return;
}
```

### 9.4. Navigation Guards

**Before Entering `/learn`:**

- No special guard needed (protected by `requiresAuth`)
- Fetching flashcards happens on mount

**Before Leaving `/learn`:**

- (Optional) Confirm exit if session is in progress and flashcards remain unrated
- Can be implemented as a navigation guard or beforeunload event

**Before Entering `/learn/summary`:**

- (Optional) Redirect to dashboard if no session statistics exist

## 10. Error Handling

### 10.1. API Errors

All API errors are handled by the existing axios interceptor located in `@/api/axios.ts`. The interceptor automatically:

- Shows a loading overlay during requests
- Displays error notifications for failed requests
- Handles 401 errors by redirecting to login

**Specific Error Scenarios:**

1. **401 Unauthorized (Missing/Invalid Token):**

   - Interceptor redirects to `/login`
   - User must re-authenticate

2. **403 Forbidden (Flashcard Belongs to Different User):**

   - Interceptor shows error notification
   - Flashcard remains in queue
   - User can try again or skip (if skip functionality is added)

3. **404 Not Found (Flashcard Deleted):**

   - Interceptor shows error notification
   - Component should remove flashcard from local state and continue to next
   - Implementation: Catch error in store action, remove from array, don't re-throw

4. **400 Bad Request (Invalid Grade Value):**

   - Interceptor shows validation error notification
   - Should not occur if frontend validation is correct
   - Defensive check: Log error and allow user to retry

5. **Network Errors (No Internet Connection):**
   - Interceptor shows generic error notification
   - User can retry when connection is restored

### 10.2. Component-Level Error Handling

**LearningSessionView:**

1. **No Due Flashcards:**

   - **Scenario:** User navigates to `/learn` but has no due flashcards
   - **Handling:** Render `EmptyState` component instead of learning interface
   - **Prevention:** Dashboard disables "Start Learning" button when `!hasDueFlashcards`

2. **Flashcard Data Incomplete:**

   - **Scenario:** Flashcard object missing question or answer
   - **Handling:** Display error message in `FlashcardDisplay`, skip to next flashcard
   - **Implementation:** Add validation in component

3. **Session Interrupted:**
   - **Scenario:** User closes browser or navigates away mid-session
   - **Handling:** Session state is lost (acceptable for MVP)
   - **Future Enhancement:** Persist session state to localStorage

**LearningSummaryView:**

1. **No Statistics Available:**

   - **Scenario:** User navigates directly to `/learn/summary` without completing session
   - **Handling:** Display message and "Return to Dashboard" button
   - **Check:** `if (!sessionStatistics) { render fallback }`

2. **Invalid Statistics Data:**
   - **Scenario:** Statistics object corrupted or incomplete
   - **Handling:** Gracefully handle missing fields, show partial data
   - **Implementation:** Use optional chaining and nullish coalescing

### 10.3. Edge Cases

1. **Rating Same Flashcard Twice:**

   - **Prevention:** Disable rating buttons immediately after selection (`isRating = true`)
   - **Backend Protection:** API validates flashcard ownership

2. **Flashcard Deleted During Session:**

   - **Scenario:** Another client/session deletes a flashcard that's in the current session
   - **Handling:** API returns 404, interceptor shows notification, remove from local state, continue
   - **Implementation:** In store action, catch 404 specifically and handle gracefully

3. **Session Duration Calculation:**

   - **Scenario:** User pauses mid-session, duration becomes very long
   - **Handling:** Display duration as-is (no maximum limit for MVP)
   - **Future Enhancement:** Detect inactivity and pause timer

4. **Division by Zero in Statistics:**
   - **Scenario:** Calculating percentages when `totalReviewed === 0`
   - **Handling:** Check before dividing, display "N/A" or 0%
   - **Implementation:** `const percentage = total > 0 ? (count / total) * 100 : 0`

## 11. Implementation Steps

### Step 1: Update Type Definitions

1. Open `frontend/src/types/learning.types.ts`
2. Add new types:
   - `LearningSessionState`
   - `SessionStatistics`
   - `RatingDistribution`
   - `FlashcardRatingPayload`

### Step 2: Extend API Layer

1. Open `frontend/src/api/learning.api.ts`
2. Add `rateFlashcard` function
3. Import required types from `learning.types.ts`

### Step 3: Update Learning Store

1. Open `frontend/src/features/learning/store.ts`
2. Add new state properties:
   - `sessionStatistics`
   - `isSessionActive`
3. Add new computed property:
   - `currentFlashcard`
4. Add new actions:
   - `rateFlashcard`
   - `startSession`
   - `endSession`
   - `resetSessionStatistics`

### Step 4: Create Child Components

1. Create `frontend/src/features/learning/components/FlashcardDisplay.vue`

   - Implement question/answer display logic
   - Add "Show Answer" button
   - Implement smooth transition for answer reveal
   - Ensure keyboard accessibility

2. Create `frontend/src/features/learning/components/RatingButtons.vue`

   - Render 6 rating buttons (0-5)
   - Add descriptive labels and color coding
   - Implement responsive layout
   - Emit `rate` event with selected grade

3. Check if `EmptyState.vue` exists in flashcards feature

   - If yes, evaluate for reuse or create learning-specific version
   - If no, create `frontend/src/features/learning/components/EmptyState.vue`

4. Create `frontend/src/features/learning/components/SessionStats.vue`
   - Display statistics in organized layout
   - Show rating distribution
   - Calculate and display average rating
   - Use Vuetify components for styling

### Step 5: Create Views Directory

1. Create directory `frontend/src/features/learning/views/` if it doesn't exist

### Step 6: Implement LearningSessionView

1. Create `frontend/src/features/learning/views/LearningSessionView.vue`
2. Set up script section:
   - Import store, components, types
   - Initialize local state variables
   - Implement `onMounted` to fetch flashcards and start session
3. Implement methods:
   - `handleShowAnswer()` - Sets `isAnswerVisible = true`
   - `handleRateFlashcard(grade)` - Calls store action, handles navigation
   - `navigateToSummary()` - Routes to summary view
4. Set up template:
   - Add `v-container` wrapper
   - Conditionally render `EmptyState` or learning interface
   - Add progress indicator
   - Render `FlashcardDisplay` with current flashcard
   - Conditionally render `RatingButtons` when answer is visible
5. Test all user interactions and edge cases

### Step 7: Implement LearningSummaryView

1. Create `frontend/src/features/learning/views/LearningSummaryView.vue`
2. Set up script section:
   - Import store, components, types
   - Read session statistics from store
   - Implement navigation handler
3. Implement methods:
   - `returnToDashboard()` - Navigate to `/`, reset statistics
4. Set up template:
   - Add `v-container` wrapper
   - Render header with celebratory message
   - Render `SessionStats` component with statistics
   - Add "Return to Dashboard" button
5. Handle edge case where no statistics exist

### Step 8: Update Router Configuration

1. Open `frontend/src/router/index.ts`
2. Update `/learn` route:
   - Change component from placeholder to `LearningSessionView`
3. Add `/learn/summary` route:
   - Path: `'learn/summary'`
   - Name: `'learn-summary'`
   - Component: `LearningSummaryView` (lazy loaded)
   - Meta: `{ requiresAuth: true }`

### Step 9: Add Internationalization Keys

1. Open i18n message files for supported languages (EN, PL)
2. Add translation keys for:
   - Learning session UI labels
   - Rating button descriptions
   - Empty state messages
   - Summary view text
   - Progress indicators

### Step 10: Integration Testing

1. Test complete flow from dashboard to session to summary:
   - Start learning session from dashboard
   - Review multiple flashcards
   - Rate with different grades
   - Complete session and view summary
   - Return to dashboard
2. Test edge cases:
   - No due flashcards
   - Single flashcard session
   - All flashcards rated with same grade
   - Network errors during rating
3. Test keyboard navigation throughout the flow
4. Verify all error scenarios are handled gracefully

### Step 11: Update Dashboard View

1. Verify "Start Learning" button is properly wired to `/learn` route
2. Ensure due flashcards count is displayed correctly
3. Test disabled state when no flashcards are due

### Step 12: Final Review and Cleanup

1. Remove any console.log statements
2. Verify all TypeScript types are correct
3. Ensure all components follow project coding standards
4. Check Vuetify class usage (minimize custom CSS)
5. Verify accessibility (keyboard navigation, ARIA labels)
6. Test responsive design on different screen sizes
