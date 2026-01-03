# Generate Flashcards View Implementation Plan

## 1. Overview

The Generate Flashcards View allows authenticated users to input text (lecture notes, study materials, etc.) and trigger AI-powered flashcard generation. The view features a large text area with real-time character counting and client-side validation before submitting to the API. The language for generation is automatically determined from the user's interface language stored in localStorage. Upon successful generation, users are automatically redirected to the Review Flashcards View to review and finalize the generated candidates.

## 2. View Routing

- **View Name**: `GenerateView.vue`
- **Route Path**: `/generate`
- **Route Name**: `generate`
- **Route Protection**: Protected (requires authentication)
- **Layout**: `DefaultLayout.vue`
- **Navigation Guard**: `requireAuth` - redirects to `/login` if user is not authenticated

## 3. Component Structure

```
GenerateView.vue
├── DefaultLayout.vue (wrapper)
│   ├── TheHeader.vue
│   └── TheFooter.vue
└── View Content
    ├── VContainer
    │   ├── VRow
    │   │   └── VCol
    │   │       ├── PageTitle (h1)
    │   │       ├── IntroductionText (p)
    │   │       └── GenerateFlashcardsForm
    │   │           ├── VTextarea (inputText with counter)
    │   │           └── VBtn (generate button)
```

## 4. Component Details

### 4.1. GenerateView.vue (Main View Component)

**Description**:
Main view component that orchestrates the flashcard generation process. Contains a form for text input and submission handling. Language is automatically determined from i18n locale (stored in localStorage). Loading and error states are managed globally by axios interceptor.

**Main Elements**:

- `VContainer` - Main container with responsive padding
- `VRow` / `VCol` - Vuetify grid layout for centering content
- `h1` - Page title ("Generate Flashcards" - i18n)
- `p` - Instructions text explaining the feature (max 10,000 characters)
- `VForm` - Form wrapper with validation
- `VTextarea` - Multi-line text input for study material with built-in character counter
- `VBtn` - Primary action button to submit generation (Vuetify button with loading state)

**Handled Events**:

- `@submit.prevent` on form - Triggers `handleGenerate()` method
- `@input` on VTextarea - Updates character count reactively

**Validation Conditions**:

1. **Input Text Required**: Text area must not be empty
   - Error message: "Please enter text to generate flashcards"
2. **Minimum Length**: Text must be at least 50 characters
   - Error message: "Text must be at least 50 characters long"
3. **Maximum Length**: Text must not exceed 10,000 characters
   - Error message: "Text must not exceed 10,000 characters"
   - Real-time counter: Shows "X / 10,000" below textarea
4. **Language**: Automatically retrieved from `i18n.global.locale.value` (localStorage)
   - Valid values: 'pl' (Polish), 'en' (English)

**Types**:

- `GenerateFlashcardsRequest` (request DTO - already defined in flashcards.types.ts)
- `GenerateFlashcardsResponse` (response DTO - already defined in flashcards.types.ts)

**Props**: None (top-level view component)

### 4.2. Character Counter Component

**Description**:
Inline text display showing current character count vs maximum limit (10,000). Changes color to warning (orange/amber) when approaching limit (>9,500) and error (red) when exceeding limit.

**Main Elements**:
ypes/flashcards.types.ts`:

```typescript
// Request DTO for generate endpoint
export interface GenerateFlashcardsRequest {
  inputText: string; // Required, max 10,000 chars
  language?: 'pl' | 'en'; // Optional, defaults to 'en'
}

// Response DTO from generate endpoint
export interface GenerateFlashcardsResponse {
  generationEventId: number; // Event ID for review completion
  candidates: FlashcardCandidate[]; // Array of generated flashcards
  cadidatesCount: number; // Total count (typo in backend - "cadidates")
  createdAtUtc: string; // ISO 8601 timestamp
}

// Flashcard candidate structure
export interface FlashcardCandidate {
  candidateId: string; // Temporary ID (e.g., "temp-1")
  question: string; // Flashcard question
  answer: string; // Flashcard answer
}
```

### 5.2. View Models (Component-Specific)

````typescript
// Language selector options
interface LanguageOption {
  value: 'pl' | 'en'
  label: string          // Localized label from i18n
}

// Form state
All types are already defined in `frontend/src/types/flashcards.types.ts`:

- `GenerateFlashcardsRequest` - Request DTO with `inputText` (string) and optional `language` ('pl' | 'en')
- `GenerateFlashcardsResponse` - Response DTO with `generationEventId` (number), `candidates` (array), `cadidatesCount` (number), and `createdAtUtc` (string)
- `FlashcardCandidate` - Candidate structure with `candidateId` (string), `question` (string), and `answer` (string)

### 6.2. Composable Usage

The view uses a custom composable `useFlashcardGeneration` from `frontend/src/composables/useFlashcardGeneration.ts`:

```typescript
// In GenerateView.vue
import { useFlashcardGeneration } from '@/composables/useFlashcardGeneration'

const { generateFlashcards, isLoading, error } = useFlashcardGeneration()
````

The composable encapsulates API communication logic and provides:

- `generateFlashcards()` - Async function to call generation API
- `isLoading` - Reactive boolean for loading state
- `error` - Reactive error message (null if no error)

### 6.3. State Flow

1. **Initial State**: Form is empty, no errors, not loading
2. **User Input**: `formState.

The Generate view manages state locally using Vue 3 Composition API. No Pinia store is required since state is ephemeral and not shared with other components.

**State Variables**:

- `inputText` (ref) - Text input from user
- `characterCount` (computed) - Calculated from `inputText.length`
- `isValid` (computed) - Validation check: `50 <= characterCount <= 10000`
- `language` (computed) - Retrieved from `i18n.global.locale.value` (localStorage)

**Loading and Error States**: Managed globally by axios interceptor (see `frontend/src/api/axios.ts`):

- `uiStore.startLoading()` / `uiStore.stopLoading()` - Automatic loading indicator
- Error notifications - Automatic via `useNotifications().showError()`

### 6.2. State Flow

1. **Initial State**: Form is empty with `inputText = ''`
2. **User Input**: `inputText` updates on textarea input, `characterCount` recomputes
3. **Validation**: `isValid` computed property evaluates in real-time
4. **Submission**:
   - Client-side validation check
   - Call API function directly from `flashcards.api.ts`
   - Axios interceptor handles loading state and error display
   - On success: Navigate to `/review/:eventId`
5. **Language**: Automatically retrieved from current locale in i18n/localStorage

- Store `generationEventId` in router params
- Navigate to `/review/:eventId` with generated candidates
- Optionally show success toast notification

**Error Responses**:

1. **400 Bad Request** - Validation error

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation error",
  "status": 400,
  "errors": {
    "inputText": ["Input text must not exceed 10000 characters"]
  }
}
```

2. **401 Unauthorized** - Missing or invalid token

   - Action: Redirect to `/login`

3. **503 Service Unavailable** - AI service (Ollama) is down

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Service unavailable",
  "status": 503,
  "detail": "AI generation service is temporarily unavailable. Please try again later."
}
```

### 7.5. Error Handling in Component

```typescript
const handleGenerate = async () => {
  // Clear previous errors
  errorMessage.value = null

  // Client-side validation
  if (!isValid.value) {
    errorMessage.value = t('generate.errors.invalidInput')
    return
  }

  try {automatically added by axios interceptor)
**Request Content-Type**: `application/json`

### 7.2. Request Structure

The request includes:
- `inputText` - User's input text (trimmed)
- `language` - Current locale from i18n (`i18n.global.locale.value`)

### 7.3. API Function Location

Create/use function in `frontend/src/api/flashcards.api.ts`:
- Import axios instance from `./axios`
- Make POST request to `/api/flashcards/generate`
- Return typed response: `GenerateFlashcardsResponse`

### 7.4. Response Handling

**Success Response (201 Created)**:
- Navigate to `/review/:eventId` using `generationEventId` from response
- Axios interceptor automatically stops loading indicator

**Error Responses**:
All errors are automatically handled by axios interceptor (`frontend/src/api/axios.ts`):
- **400 Bad Request** - Validation errors displayed via `showError` notification
- **401 Unauthorized** - Should trigger redirect to login (handled globally)
- **503 Service Unavailable** - Error message displayed via notification
- **Network Errors** - Automatically caught and displayed

**Component Error Handling**:
- Perform client-side validation before API call
- If validation fails, show local error message
- All API errors handled by interceptor - no try/catch needed in component
- On success: navigate to review page*UI Impact**: Submit button disabled, error shown on blur

**Minimum Length**:
- **Condition**: `inputText.length < 50`
- **Component**: GenerateView.vue (textarea)
- **Error Message**: "Text must be at least 50 characters long for meaningful flashcard generation"
- **UI Impact**: Submit button disabled, warning shown below textarea

**Maximum Length**:
- **Condition**: `inputText.length > 10000`
- **Component**: GenerateView.vue (textarea)
- **Error Message**: "Text must not exceed 10,000 characters"
- **UI Impact**:
  - Submit button disabled
  - Character counter turns red
  - Error message shown below textarea
  - Additional input prevented by textarea `maxlength` attribute

**Whitespace Only**:
- **Condition**: `inputText.trim().length === 0 && inputText.length > 0`
- **Component**: GenerateView.vue (textarea)
- **Error Message**: "Text cannot consist only of whitespace"
- **UI Impact**: Submit button disabled

#### 9.1.2. Language Validation

**Valid Values**:
- **Condition**: `language !== 'pl' && language !== 'en'`
- **Component**: GenerateView.vue (VSelect)
- **Error Message**: "Please select a valid language"
- **UI Impact**: This should never occur due to dropdown constraint, but prevents accidental invalid values

### 9.2. Server-Side Validation

The backend performs additional validation that may catch edge cases:

**Input Text Length**:
- **Backend Rule**: 0 < length <= 10,000 characters
- **Response**: 400 Bad Request with validation error details
- **UI Handling**: Display API error message in VAlert

**Language Value**:
- **Backend Rule**: Must be 'pl' or 'en' (if provided)
- **Response**: 400 Bad Request
- **UI Handling**: Display error message

**Authentication**:
- **Backend Rule**: Valid JWT token required
- **Response**: 401 Unauthorized
- *VTextarea counter updates automatically (Vuetify built-in feature)
4. Submit button enabled/disabled based on character count validation

**Expected Outcome**:
- Reactive character count display via Vuetify counter
- Visual feedback for length constraints (error state when >10,000)
- Form submission only allowed when 50-10,000 characters

### 8.2. Form Submission

**Action**: User clicks "Generate Flashcards" button

**Flow**:
1. User clicks submit button
2. Client-side validation runs:
   - Check if text is 50-10,000 characters
   - If invalid: Display local validation error, prevent submission
3. If valid:
   - API request sent to `/api/flashcards/generate` with `inputText` and `language`
   - Axios interceptor automatically shows global loading indicator
4. On success:
   - Loading indicator hidden automatically
   - Navigate to `/review/:eventId`
5. On error:
   - Loading indicator hidden automatically
   - Error notification displayed automatically by axios interceptor

**Expected Outcome**:
- Successful generation → Redirect to review page
- Error → Notification displayed, user can retry

### 8.3. Error Recovery

**Action**: User encounters error and wants to retry

**Flow**:
1. Error notification displayed automatically by axios interceptor
2. User can:
   - Modify input text
   - Click "Generate Flashcards" again to retry
3. New submission clears previous error

**Expected Outcome**:
- User can retry without page reload
- Clear error feedback via notification systemwn
- Form remains editable
- Focus moved to first invalid field

### 10.4. Authentication Errors (401)

**Scenario**: JWT token expired or invalid

**Detection**: Response status 401

**Handling**:
1. Clear authentication state in Pinia store
2. Redirect to `/login` with return URL
3. Display toast: "Your session has expired. Please log in again."

**UI State**:
- User redirected away from page
- Form state lost (expected behavior)

### 10.5. Generic Server Errors (500)

**Scenario**: Unexpected backend error

**Detection**: Response status 5xx (except 503)

**Handling**:
1. Display generic error message: "An unexpected error occurred. Please try again."
2. Log full error details to console
3. Optionally report error to monitoring service
.

#### 9.1.1. Input Text Validation

**Required Field**:
- **Condition**: `inputText.trim().length === 0`
- **Error Display**: Local validation message
- **UI Impact**: Submit button disabled

**Minimum Length**:
- **Condition**: `inputText.length < 50`
- **Error Display**: Show validation message
- **UI Impact**: Submit button disabled

**Maximum Length**:
- **Condition**: `inputText.length > 10000`
- **Error Display**: VTextarea shows error state automatically
- **UI Impact**:
  - Submit button disabled
  - VTextarea counter shows error color (Vuetify built-in)
  - Use `maxlength="10000"` attribute to prevent additional input

**Validation Logic**:
- Computed property: `isValid = 50 <= inputText.length <= 10000`
- Button `:disabled="!isValid"` binding

#### 9.1.2. Language Validation

**Language Source**:
- Retrieved automatically from `i18n.global.locale.value`
- No user selection needed - uses interface language from localStorage
- Must be 'pl' or 'en' (guaranteed by i18n configuration)

### 9.2. Server-Side Validation

Backend validation is handled, errors displayed via axios interceptor:

**Input Text Length**:
- **Backend Rule**: 0 < length <= 10,000 characters
- **Response**: 400 Bad Request
- **UI Handling**: Error notification shown automatically
Global Error Handling (Axios Interceptor)

All API errors are automatically handled by the axios interceptor (`frontend/src/api/axios.ts`):

**Automatic Handling**:
- Loading indicator shown on request start
- Loading indicator hidden on response/error
- Error messages extracted and displayed via `useNotifications().showError()`
- Validation errors parsed and shown automatically

**Error Types Handled**:
- **Network Errors**: Automatic notification
- **400 Bad Request**: Validation errors displayed
- **401 Unauthorized**: Should trigger auth redirect (global handling)
- **503 Service Unavailable**: Error notification shown
- **500 Server Errors**: Generic error notification

### 10.2. Component-Level Error Handling

**Client-Side Validation**:
- Perform validatioAPI Function

**Action**: Add function to `frontend/src/api/flashcards.api.ts`
**Details**:
- Import axios instance from `./axios`
- Create `generateFlashcardsFromText()` function
- Accept `GenerateFlashcardsRequest` parameter
- Return `GenerateFlashcardsResponse` type
- POST to `/api/flashcards/generate`

### Step 2: Create View Component File

**Action**: Create `frontend/src/features/generation/views/GenerateView.vue`
**Details**:
- Use `<script setup lang="ts">`
- Import necessary composables: `useRouter`, `useI18n`
- Import API function from `flashcards.api.ts`
- Import types from `flashcards.types.ts`

### Step 3: Implement Component State

**Action**: Define reactive state in component
**Details**:
- `inputText` ref for textarea value
- `characterCount` computed from `inputText.length`
- `isValid` computed: `50 <= characterCount <= 10000`
- `language` computed from `i18n.global.locale.value`
- Local validation error message (optional)

### Step 4: Implement Submit Handler

**Action**: Create `handleGenerate()` async function
**Details**:
- Validate `isValid` before submission
- If invalid, show local error and return
- Call API function with `inputText.trim()` and `language`
- On success: navigate to `/review/:eventId` using router
- Handle empty candidates case (if `candidatesCount === 0`)
- Errors automatically handled by axios interceptor

### Step 5: Build Template Structure

**Action**: Create template with Vuetify components
**Details**:
- `VContainer` with responsive layout
- Page title (h1) and description (p) with i18n
- `VForm` with `@submit.prevent="handleGenerate"`
- `VTextarea` with:
  - `v-model="inputText"`
  - `:maxlength="10000"`
  - `counter` prop for character display
  - `variant="outlined"`
  - Error state when validation fails
- `VBtn` for submission with:
  - `type="submit"`
  - `:disabled="!isValid"`
  - `color="primary"`

### Step 6: Add Route Definition

**Action**: Update `frontend/src/router/index.ts`
**Details**:
- Path: `/generate`
- Name: `generate`
- Component: lazy-loaded `GenerateView.vue`
- Meta: `requiresAuth: true`, `layout: 'default'`

### Step 7: Add i18n Translations

**Action**: Add translations to `frontend/src/i18n/locales/en.json` and `pl.json`
**Details**:
- Page title and description
- Form labels and placeholders
- Validation error messages
- Submit button text

### Step 8: Add Navigation Link

**Action**: Update main navigation component (e.g., `TheHeader.vue`)
**Details**:
- Add `VBtn` or navigation link to `/generate` route
- Use i18n for link text
```
