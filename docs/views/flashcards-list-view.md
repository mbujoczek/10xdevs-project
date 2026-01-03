# Flashcards List View Implementation Plan

## 1. Overview

The Flashcards List View serves as the central management interface for all user-owned flashcards. It displays a comprehensive list of both AI-generated and manually created flashcards, providing full CRUD (Create, Read, Update, Delete) functionality. Users can view all their flashcards, create new ones manually, edit existing cards to correct errors or update information, and delete cards they no longer need. The view implements a clean, card-based layout with immediate visual feedback and confirmation dialogs for destructive actions. An empty state is displayed when no flashcards exist, encouraging users to create their first card or generate cards using AI.

## 2. View Routing

**Path:** `/flashcards`  
**Route Name:** `flashcards`  
**Component:** `FlashcardsView.vue`  
**Location:** `frontend/src/features/flashcards/views/FlashcardsView.vue`

**Route Configuration:**

```typescript
{
  path: '/flashcards',
  name: 'flashcards',
  component: () => import('@/features/flashcards/views/FlashcardsView.vue'),
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
        └── FlashcardsView.vue (Container)
            ├── v-container (Vuetify)
            │   ├── v-row
            │   │   └── v-col
            │   │       └── v-card (Page Header)
            │   │           ├── v-card-title (Page Title)
            │   │           └── v-card-actions
            │   │               └── v-btn (Add New Flashcard)
            │   └── v-row
            │       └── v-col
            │           ├── EmptyState (if no flashcards)
            │           └── FlashcardsList (if flashcards exist)
            │               └── FlashcardCard (repeated for each flashcard)
            │                   ├── Question/Answer display
            │                   └── Action buttons (Edit, Delete)
            ├── CreateEditFlashcardDialog
            └── DeleteConfirmDialog
            └── (Composed with: useFlashcardsStore, useI18n, useRouter)
```

**Feature Module Structure:**

```
frontend/src/
└── features/
    └── flashcards/
        ├── views/
        │   └── FlashcardsView.vue
        ├── components/
        │   ├── FlashcardsList.vue
        │   ├── FlashcardCard.vue
        │   ├── CreateEditFlashcardDialog.vue
        │   └── EmptyState.vue
        └── store.ts
```

**Shared Components Used:**

```
frontend/src/
└── components/
    └── dialogs/
        └── DeleteConfirmDialog.vue (reusable)
```

## 4. Component Details

### 4.1. FlashcardsView.vue

**Description:**  
The main container view component for the Flashcards management page. Responsible for loading flashcards data from the API on mount, managing dialog states (create/edit/delete), and coordinating interactions between child components. Uses Vuetify's layout system for responsive design.

**Main HTML Elements & Child Components:**

- `v-container` with `max-width="60em"` for consistent layout width
- `v-row` and `v-col` for grid layout
- `v-card` for page header with title and "Add New" button
- `EmptyState` component when `flashcards.length === 0`
- `FlashcardsList` component when flashcards exist
- `CreateEditFlashcardDialog` component for create/edit operations
- `DeleteConfirmDialog` component for delete confirmation

**Handled Events:**

- **@add-new:** Opens create dialog with empty form
- **@edit-flashcard:** Opens edit dialog with flashcard data (from FlashcardCard)
- **@delete-flashcard:** Opens delete confirmation dialog (from FlashcardCard)
- **@save-flashcard (from CreateEditFlashcardDialog):** Calls store action to create/update flashcard
- **@confirm-delete (from DeleteConfirmDialog):** Calls store action to delete flashcard
- **@cancel (from dialogs):** Closes respective dialog

**Validation Conditions:**

- None (validation handled in dialog component)

**Required Types:**

- `Flashcard` from `@/types/flashcards.types`
- `CreateFlashcardRequest` from `@/types/flashcards.types`
- `UpdateFlashcardRequest` from `@/types/flashcards.types`

**Props:**

- None (root view component)

**Local State:**

```typescript
const isCreateEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedFlashcard = ref<Flashcard | null>(null);
const dialogMode = ref<'create' | 'edit'>('create');
```

**Composition API Usage:**

```typescript
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFlashcardsStore } from '@/features/flashcards/store';

const { t } = useI18n();
const flashcardsStore = useFlashcardsStore();

const flashcards = computed(() => flashcardsStore.flashcards);
const hasFlashcards = computed(() => flashcards.value.length > 0);

onMounted(async () => {
  await flashcardsStore.getFlashcards();
});
```

**Methods:**

- `handleAddNew()` - Opens create dialog
- `handleEdit(flashcard: Flashcard)` - Opens edit dialog with flashcard data
- `handleDelete(flashcard: Flashcard)` - Opens delete confirmation
- `handleSave(data: CreateFlashcardRequest)` - Saves flashcard (create or update)
- `handleConfirmDelete()` - Confirms and executes delete

---

### 4.2. FlashcardsList.vue

**Description:**  
A presentational component that receives an array of flashcards via props and renders them in a responsive grid layout using `FlashcardCard` components. Manages the display density and spacing between cards.

**Main HTML Elements & Child Components:**

- `v-row` with `dense` prop for compact spacing
- Multiple `v-col` elements (responsive breakpoints: cols="12" md="6" lg="4")
- `FlashcardCard` components for each flashcard

**Handled Events:**

- **@edit:** Emits edit event with flashcard data to parent
- **@delete:** Emits delete event with flashcard data to parent

**Validation Conditions:**

- None (receives validated data from parent)

**Required Types:**

- `Flashcard` from `@/types/flashcards.types`

**Props:**

```typescript
interface Props {
  flashcards: Flashcard[];
}
```

**Emits:**

```typescript
const emit = defineEmits<{
  edit: [flashcard: Flashcard];
  delete: [flashcard: Flashcard];
}>();
```

---

### 4.3. FlashcardCard.vue

**Description:**  
A presentational card component that displays a single flashcard's question and answer with action buttons (Edit, Delete). Uses Vuetify's `v-card` for consistent Material Design styling with elevation and hover effects.

**Main HTML Elements & Child Components:**

- `v-card` with hover elevation effect
- `v-card-title` for question
- `v-card-text` for answer
- `v-card-actions` for action buttons
- `v-btn` components for Edit and Delete actions
- `v-icon` for button icons

**Handled Events:**

- **@click on Edit button:** Emits edit event with flashcard data
- **@click on Delete button:** Emits delete event with flashcard data

**Validation Conditions:**

- None

**Required Types:**

- `Flashcard` from `@/types/flashcards.types`

**Props:**

```typescript
interface Props {
  flashcard: Flashcard;
}
```

**Emits:**

```typescript
const emit = defineEmits<{
  edit: [flashcard: Flashcard];
  delete: [flashcard: Flashcard];
}>();
```

**Visual Features:**

- Display question with `text-h6` typography
- Display answer with `text-body-2` typography, multi-line with ellipsis if too long
- Show source badge (AI/Manual) and status badge (Accepted/Edited) using `v-chip`
- Edit button with pencil icon (mdi-pencil)
- Delete button with delete icon (mdi-delete) in error color

---

### 4.4. CreateEditFlashcardDialog.vue

**Description:**  
A modal dialog component for both creating new flashcards and editing existing ones. Contains a form with two text fields (question and answer) and implements client-side validation according to API requirements. The dialog title and submit button text change based on mode (create vs edit).

**Main HTML Elements & Child Components:**

- `v-dialog` with `max-width="600px"`
- `v-card` for dialog content
- `v-card-title` with dynamic text based on mode
- `v-card-text` containing form:
  - `v-textarea` for question (with counter and validation)
  - `v-textarea` for answer (with counter and validation)
- `v-card-actions` with Cancel and Save buttons

**Handled Events:**

- **@save:** Emits save event with form data (CreateFlashcardRequest or UpdateFlashcardRequest)
- **@cancel:** Emits cancel event to close dialog

**Validation Conditions:**

Based on API requirements:

1. **Question:**

   - Required: Cannot be empty
   - Max length: 200 characters
   - Validation rules applied via Vuetify's `:rules` prop

2. **Answer:**
   - Required: Cannot be empty
   - Max length: 500 characters
   - Validation rules applied via Vuetify's `:rules` prop

**Required Types:**

- `Flashcard` from `@/types/flashcards.types`
- `CreateFlashcardRequest` from `@/types/flashcards.types`
- `UpdateFlashcardRequest` from `@/types/flashcards.types`

**Props:**

```typescript
interface Props {
  modelValue: boolean; // v-model for dialog visibility
  mode: 'create' | 'edit';
  flashcard?: Flashcard | null; // Populated when mode is 'edit'
}
```

**Emits:**

```typescript
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [data: CreateFlashcardRequest | UpdateFlashcardRequest];
  cancel: [];
}>();
```

**Local State:**

```typescript
const formRef = ref<any>(null);
const formData = ref({
  question: '',
  answer: '',
});
```

**Validation Rules:**

```typescript
const questionRules = [
  (v: string) => !!v || t('flashcards.form.errors.questionRequired'),
  (v: string) => v.length <= 200 || t('flashcards.form.errors.questionTooLong'),
];

const answerRules = [
  (v: string) => !!v || t('flashcards.form.errors.answerRequired'),
  (v: string) => v.length <= 500 || t('flashcards.form.errors.answerTooLong'),
];
```

**Methods:**

- `handleSave()` - Validates form and emits save event
- `handleCancel()` - Resets form and emits cancel event
- `resetForm()` - Clears form data
- `loadFlashcard()` - Loads flashcard data when mode is edit

**Watch:**

- Watch `props.flashcard` to populate form when editing
- Watch `props.modelValue` to reset form when dialog closes

---

### 4.5. EmptyState.vue

**Description:**  
A reusable component displayed when the user has no flashcards. Shows an encouraging message with an illustration or icon and action buttons to create a flashcard or generate flashcards from text.

**Main HTML Elements & Child Components:**

- `v-card` with centered content
- `v-card-text` containing:
  - `v-icon` with large size (mdi-cards-outline or similar)
  - `div` with title message
  - `div` with description text
- `v-card-actions` with centered buttons:
  - `v-btn` for "Create Flashcard"
  - `v-btn` for "Generate from Text"

**Handled Events:**

- **@create:** Emits event to open create flashcard dialog
- **@generate:** Navigates to generate view

**Validation Conditions:**

- None

**Required Types:**

- None

**Props:**

- None (or minimal configuration props for customization)

**Emits:**

```typescript
const emit = defineEmits<{
  create: [];
}>();
```

---

### 4.6. DeleteConfirmDialog.vue (Shared Component)

**Description:**  
A reusable confirmation dialog component for destructive actions. Can be used across the application for any delete confirmation. Displays a warning message and requires explicit confirmation before proceeding.

**Main HTML Elements & Child Components:**

- `v-dialog` with `max-width="400px"`
- `v-card` for dialog content
- `v-card-title` with warning icon and title
- `v-card-text` with confirmation message
- `v-card-actions` with Cancel and Confirm buttons (Confirm in error color)

**Handled Events:**

- **@confirm:** Emits confirm event when user confirms action
- **@cancel:** Emits cancel event to close dialog

**Validation Conditions:**

- None

**Required Types:**

- None (generic component)

**Props:**

```typescript
interface Props {
  modelValue: boolean; // v-model for dialog visibility
  title?: string; // Dialog title (default from i18n)
  message?: string; // Confirmation message (default from i18n)
  confirmText?: string; // Confirm button text (default from i18n)
  cancelText?: string; // Cancel button text (default from i18n)
}
```

**Emits:**

```typescript
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();
```

---

## 5. Types

### 5.1. Existing Types

**Flashcard** (from `flashcards.types.ts`):

```typescript
export interface Flashcard {
  id: number; // Unique flashcard identifier
  question: string; // Flashcard question (max 200 chars)
  answer: string; // Flashcard answer (max 500 chars)
  source: FlashcardSource; // 0=AI, 1=Manual
  status: FlashcardStatus; // 0=Not Applicable, 1=Accepted, 2=Edited, 3=Deleted
  srsInterval: number | null; // Days until next review
  srsRepetitions: number | null; // Number of times reviewed
  srsEaseFactor: number | null; // SRS algorithm ease factor
  srsNextRepetitionDate: string | null; // ISO date of next review
  srsLastGrade: SRSGrade | null; // Last rating (0-5)
  createdAtUtc: string; // ISO date of creation
  updatedAtUtc: string; // ISO date of last update
}
```

**CreateFlashcardRequest** (from `flashcards.types.ts`):

```typescript
export interface CreateFlashcardRequest {
  question: string; // Required, max 200 characters
  answer: string; // Required, max 500 characters
}
```

**UpdateFlashcardRequest** (from `flashcards.types.ts`):

```typescript
export type UpdateFlashcardRequest = CreateFlashcardRequest;
```

**ListFlashcardsResponse** (from `flashcards.types.ts`):

```typescript
export interface ListFlashcardsResponse {
  flashcards: Flashcard[]; // Array of user's flashcards
  totalCount: number; // Total number of flashcards
}
```

### 5.2. Enum Types

**FlashcardSource** (from `enums.ts`):

```typescript
export enum FlashcardSource {
  AI = 0,
  Manual = 1,
}
```

**FlashcardStatus** (from `enums.ts`):

```typescript
export enum FlashcardStatus {
  NotApplicable = 0, // For manually created flashcards
  Accepted = 1, // AI-generated, accepted without editing
  Edited = 2, // AI-generated, accepted after editing
  Deleted = 3, // Soft deleted
}
```

**SRSGrade** (from `enums.ts`):

```typescript
export enum SRSGrade {
  Again = 0,
  Hard = 1,
  Good = 2,
  Easy = 3,
  VeryEasy = 4,
  Perfect = 5,
}
```

### 5.3. New Types Required

No new types are required for this view. All necessary types already exist in the type definitions.

### 5.4. Store State Types

```typescript
interface FlashcardsState {
  flashcards: Flashcard[];
  totalCount: number;
}
```

## 6. State Management

**Store:** `features/flashcards/store.ts`  
**Store Name:** `flashcardsStore`

The store manages the state for user flashcards and provides actions for all CRUD operations. It follows the established pattern of using Pinia with the Composition API (setup syntax).

**State:**

```typescript
{
  flashcards: Flashcard[]       // Array of user's flashcards
  totalCount: number            // Total count from API
}
```

**Getters:**

- `hasFlashcards: boolean` - Returns true if flashcards array is not empty
- `flashcardById(id: number): Flashcard | undefined` - Finds flashcard by ID
- `aiGeneratedFlashcards: Flashcard[]` - Filters flashcards with source === AI
- `manualFlashcards: Flashcard[]` - Filters flashcards with source === Manual

**Actions:**

- `getFlashcards(): Promise<void>` - Fetches all user flashcards from API
- `createFlashcard(request: CreateFlashcardRequest): Promise<Flashcard>` - Creates new flashcard
- `updateFlashcard(id: number, request: UpdateFlashcardRequest): Promise<Flashcard>` - Updates existing flashcard
- `deleteFlashcard(id: number): Promise<void>` - Deletes flashcard (soft delete)
- `resetState(): void` - Resets state to initial values

**Store Implementation Pattern:**

The store should follow the existing pattern from other feature stores:

- Use `defineStore` with setup function syntax
- Use `ref` for reactive state
- Use `computed` for getters
- Handle errors through axios interceptor (no manual error state needed)
- Loading state is managed globally by axios interceptor
- After successful create/update/delete, automatically refresh the flashcards list

**Optimistic Updates:**

For better UX, the store should implement optimistic updates:

- On delete: Remove flashcard from array immediately, revert on error
- On update: Update flashcard in array immediately, revert on error
- On create: Add new flashcard to array immediately after API success

## 7. API Integration

**Existing API Module:** `frontend/src/api/flashcards.api.ts`

The following functions already exist and will be used:

### 7.1. List User Flashcards

```typescript
export const listUserFlashcards = async (): Promise<ListFlashcardsResponse>
```

**HTTP Details:**

- **Method:** GET
- **Endpoint:** `/api/flashcards`
- **Authentication:** Required (Bearer token automatically attached)
- **Query Parameters:** None (MVP doesn't support filtering)
- **Response Type:** `ListFlashcardsResponse`

**Success Response (200):**

```json
{
  "flashcards": [
    {
      "id": 101,
      "question": "What is the capital of France?",
      "answer": "Paris",
      "source": 0,
      "status": 1,
      "srsNextRepetitionDate": "2025-12-31T10:00:00Z",
      "srsRepetitions": 3,
      "srsEaseFactor": 2.5,
      "createdAtUtc": "2025-12-20T10:00:00Z",
      "updatedAtUtc": "2025-12-30T15:30:00Z"
    }
  ],
  "totalCount": 2
}
```

### 7.2. Create Manual Flashcard

```typescript
export const createManualFlashcard = async (
  request: CreateFlashcardRequest
): Promise<Flashcard>
```

**HTTP Details:**

- **Method:** POST
- **Endpoint:** `/api/flashcards`
- **Authentication:** Required
- **Request Body:** `CreateFlashcardRequest`
- **Response Type:** `Flashcard`

### 7.3. Update Flashcard

```typescript
export const updateFlashcard = async (
  id: number,
  request: UpdateFlashcardRequest
): Promise<Flashcard>
```

**HTTP Details:**

- **Method:** PUT
- **Endpoint:** `/api/flashcards/{id}`
- **Authentication:** Required
- **Path Parameters:** `id` (flashcard ID)
- **Request Body:** `UpdateFlashcardRequest`
- **Response Type:** `Flashcard`

### 7.4. Delete Flashcard

```typescript
export const deleteFlashcard = async (id: number): Promise<void>
```

**HTTP Details:**

- **Method:** DELETE
- **Endpoint:** `/api/flashcards/{id}`
- **Authentication:** Required
- **Path Parameters:** `id` (flashcard ID)
- **Response Type:** void (204 No Content)

**API Module Updates Required:**

The `listUserFlashcards` function should be updated to remove pagination parameters since MVP doesn't support pagination:

```typescript
export const listUserFlashcards = async (): Promise<ListFlashcardsResponse> => {
  const response = await api.get<ListFlashcardsResponse>('/flashcards');
  return response.data;
};
```

**Integration Flow:**

1. **Initial Load:**

   - `FlashcardsView.vue` mounts
   - Calls `flashcardsStore.getFlashcards()` in `onMounted` hook
   - Store action calls `listUserFlashcards()` from API module
   - Axios interceptor shows global loading overlay
   - On success, store updates `flashcards` array with response
   - Component reactively displays flashcards or empty state

2. **Create Flashcard:**

   - User clicks "Add New" button
   - `CreateEditFlashcardDialog` opens in create mode
   - User fills form and clicks Save
   - Form validation runs
   - If valid, calls `flashcardsStore.createFlashcard(request)`
   - Store action calls `createManualFlashcard()` from API module
   - On success, store calls `getFlashcards()` to refresh list
   - Dialog closes and success notification shown

3. **Edit Flashcard:**

   - User clicks "Edit" button on flashcard
   - `CreateEditFlashcardDialog` opens in edit mode with flashcard data
   - User modifies data and clicks Save
   - Form validation runs
   - If valid, calls `flashcardsStore.updateFlashcard(id, request)`
   - Store action calls `updateFlashcard()` from API module
   - On success, store updates flashcard in array
   - Dialog closes and success notification shown

4. **Delete Flashcard:**
   - User clicks "Delete" button on flashcard
   - `DeleteConfirmDialog` opens
   - User confirms deletion
   - Calls `flashcardsStore.deleteFlashcard(id)`
   - Store action calls `deleteFlashcard()` from API module
   - Store removes flashcard from array optimistically
   - On success, success notification shown
   - On error, flashcard is restored to array

**Error Handling:**

All errors are handled by axios interceptor:

- 401 Unauthorized → Redirect to login
- 403 Forbidden → Error notification
- 404 Not Found → Error notification
- 400 Bad Request → Error notification with validation details
- 500 Server Error → Generic error notification

## 8. User Interactions

### 8.1. Page Load

**Trigger:** User navigates to `/flashcards` route  
**Action:** Component mounts and fetches flashcards  
**Expected Result:**

- Global loading overlay appears (managed by axios interceptor)
- API request is sent to `/api/flashcards`
- On success with data: Flashcards are displayed in a grid of cards
- On success without data: Empty state is displayed with encouragement message and action buttons
- On error: Global error notification appears (managed by axios interceptor)

### 8.2. Create New Flashcard

**Trigger:** User clicks "Add New Flashcard" button  
**Action:** Opens create dialog  
**Expected Result:**

- `CreateEditFlashcardDialog` opens in create mode with empty form
- User can type question (max 200 chars with counter)
- User can type answer (max 500 chars with counter)
- Save button disabled if validation fails
- On clicking Save:
  - Form validation runs
  - If valid: API call is made, loading overlay shown
  - On success: Dialog closes, flashcard appears in list, success notification
  - On error: Dialog remains open, error notification shown
- On clicking Cancel or clicking outside: Dialog closes without changes

### 8.3. Edit Existing Flashcard

**Trigger:** User clicks "Edit" button on a flashcard  
**Action:** Opens edit dialog with flashcard data  
**Expected Result:**

- `CreateEditFlashcardDialog` opens in edit mode
- Form is pre-populated with flashcard's question and answer
- User can modify question and/or answer
- Character counters show current/max lengths
- Save button disabled if validation fails
- On clicking Save:
  - Form validation runs
  - If valid: API call is made, loading overlay shown
  - On success: Dialog closes, flashcard updates in list, success notification
  - On error: Dialog remains open, error notification shown
- On clicking Cancel: Dialog closes without changes

### 8.4. Delete Flashcard

**Trigger:** User clicks "Delete" button on a flashcard  
**Action:** Opens delete confirmation dialog  
**Expected Result:**

- `DeleteConfirmDialog` opens with warning message
- Dialog shows flashcard's question for confirmation
- On clicking Confirm:
  - Flashcard immediately disappears from list (optimistic update)
  - API call is made in background
  - On success: Success notification shown
  - On error: Flashcard reappears in list, error notification shown
- On clicking Cancel: Dialog closes without action

### 8.5. View Empty State

**Trigger:** User has no flashcards (new user or all deleted)  
**Action:** Automatic display when flashcards array is empty  
**Expected Result:**

- Empty state component displays with:
  - Large icon (cards outline)
  - Encouraging title: "No flashcards yet"
  - Description: "Create your first flashcard or generate them from text"
  - Two action buttons:
    - "Create Flashcard" → Opens create dialog
    - "Generate from Text" → Navigates to `/generate`

### 8.6. Language Switch

**Trigger:** User changes language via LanguageSwitcher  
**Action:** i18n locale updates  
**Expected Result:**

- All text content updates to selected language (PL/EN)
- Dialog titles, button labels, validation messages update
- Flashcard content (question/answer) remains unchanged (user data)
- Empty state messages update

### 8.7. Navigation

**Trigger:** User clicks navigation links in AppHeader  
**Action:** Vue Router navigates to selected route  
**Expected Result:**

- User can navigate away to Dashboard, Generate, Statistics, or Learn views
- Flashcards data remains cached in store (no refetch needed on return)
- Unsaved changes in dialogs are lost (warning could be added in future)

## 9. Conditions and Validation

### 9.1. Authentication

**Component Affected:** FlashcardsView.vue (and all authenticated views)  
**Condition:** User must have valid JWT token  
**Verification:** Router `beforeEach` guard checks `authStore.isAuthenticated`  
**Impact on UI:**

- If not authenticated: Redirect to `/login`
- If authenticated: Allow access to view

### 9.2. Empty State Display

**Component Affected:** FlashcardsView.vue  
**Condition:** `flashcards.length === 0`  
**Verification:** Check computed property `hasFlashcards`  
**Impact on UI:**

- If true: Display `FlashcardsList` component with cards
- If false: Display `EmptyState` component

### 9.3. Form Validation - Question Field

**Component Affected:** CreateEditFlashcardDialog.vue  
**Conditions:**

1. **Required:** Question cannot be empty
2. **Max Length:** Question must not exceed 200 characters

**Verification:**

```typescript
const questionRules = [
  (v: string) => !!v || t('flashcards.form.errors.questionRequired'),
  (v: string) => v.length <= 200 || t('flashcards.form.errors.questionTooLong'),
];
```

**Impact on UI:**

- Empty field: Shows "Question is required" error message in red
- Exceeds 200 chars: Shows "Question must not exceed 200 characters" error message
- Invalid: Save button remains disabled
- Valid: Error clears, Save button becomes enabled

### 9.4. Form Validation - Answer Field

**Component Affected:** CreateEditFlashcardDialog.vue  
**Conditions:**

1. **Required:** Answer cannot be empty
2. **Max Length:** Answer must not exceed 500 characters

**Verification:**

```typescript
const answerRules = [
  (v: string) => !!v || t('flashcards.form.errors.answerRequired'),
  (v: string) => v.length <= 500 || t('flashcards.form.errors.answerTooLong'),
];
```

**Impact on UI:**

- Empty field: Shows "Answer is required" error message in red
- Exceeds 500 chars: Shows "Answer must not exceed 500 characters" error message
- Invalid: Save button remains disabled
- Valid: Error clears, Save button becomes enabled

### 9.5. Dialog Mode

**Component Affected:** CreateEditFlashcardDialog.vue  
**Condition:** `mode === 'create'` vs `mode === 'edit'`  
**Verification:** Check `props.mode` value  
**Impact on UI:**

- Create mode:
  - Dialog title: "Create New Flashcard"
  - Submit button: "Create"
  - Form starts empty
- Edit mode:
  - Dialog title: "Edit Flashcard"
  - Submit button: "Save"
  - Form pre-populated with flashcard data

### 9.6. Delete Confirmation

**Component Affected:** DeleteConfirmDialog.vue  
**Condition:** User must explicitly confirm deletion  
**Verification:** User must click "Confirm" button  
**Impact on UI:**

- Dialog displays flashcard question for verification
- "Confirm" button in error color (red) to indicate danger
- Action only proceeds on explicit confirmation
- Cancel closes dialog without action

### 9.7. Character Counters

**Component Affected:** CreateEditFlashcardDialog.vue  
**Condition:** Display current/max character count  
**Verification:** Vuetify textarea `counter` prop  
**Impact on UI:**

- Question field: Shows "X / 200" counter below field
- Answer field: Shows "X / 500" counter below field
- Counter turns red when limit is exceeded
- Provides visual feedback on remaining characters

## 10. Error Handling

### 10.1. API Request Failure

**Scenario:** Any API endpoint returns error (401, 403, 404, 500, etc.)  
**Handling:**

- Axios interceptor automatically displays global error notification
- No additional error handling needed in component or store
- User remains on current view/dialog state

**User Experience:**

- Error notification appears at top of screen with specific message
- User can try again (retry button or manual retry)
- For create/edit: Dialog remains open, user can modify data and retry
- For delete: Optimistically removed flashcard reappears in list

### 10.2. Invalid Token

**Scenario:** JWT token is expired or invalid  
**Handling:**

- API returns 401 Unauthorized
- Axios interceptor handles token refresh or logout
- User is redirected to login page if token cannot be refreshed

**User Experience:**

- Seamless redirect to login
- User must re-authenticate
- After login, user is redirected back to flashcards view

### 10.3. Validation Errors (400 Bad Request)

**Scenario:** API returns 400 with validation errors  
**Handling:**

- Axios interceptor displays error notification with validation details
- Dialog remains open for user to correct issues

**User Experience:**

- Error notification shows specific field errors
- User can see which fields need correction
- Form validation prevents most validation errors before submission

### 10.4. Flashcard Not Found (404)

**Scenario:** User tries to edit/delete a flashcard that no longer exists  
**Handling:**

- API returns 404 Not Found
- Axios interceptor displays "Flashcard not found" error
- Store refreshes flashcards list to sync with server

**User Experience:**

- Error notification appears
- Flashcard disappears from list on refresh
- User understands the flashcard no longer exists

### 10.5. Forbidden Action (403)

**Scenario:** User tries to edit/delete a flashcard belonging to another user (edge case)  
**Handling:**

- API returns 403 Forbidden
- Axios interceptor displays "Permission denied" error

**User Experience:**

- Error notification appears
- No changes made to UI
- User understands they don't have permission

### 10.6. Network Failure

**Scenario:** No internet connection or network timeout  
**Handling:**

- Axios interceptor catches network error
- Global error notification displays generic network error message

**User Experience:**

- Error notification: "No network connection. Check your internet."
- User can retry when connection is restored
- Optimistic deletes are reverted

### 10.7. Empty List After Delete

**Scenario:** User deletes their last flashcard  
**Handling:**

- After successful delete, flashcards array becomes empty
- View automatically switches to empty state display

**User Experience:**

- Smooth transition from list to empty state
- Empty state encourages creating new flashcard or generating from text
- No error state needed

### 10.8. Concurrent Modifications

**Scenario:** Another session modifies the same flashcard  
**Handling:**

- On edit: API may return newer version or conflict
- Store always uses latest data from API response
- On list refresh: Latest data is always fetched

**User Experience:**

- User sees most recent data from server
- Conflicting edits overwrite each other (last write wins)
- MVP doesn't implement optimistic locking

## 11. Implementation Steps

### Step 1: Update API Module

Update the existing flashcards API module to ensure all functions match requirements.

**File:** `frontend/src/api/flashcards.api.ts`

**Tasks:**

- Verify `listUserFlashcards()` function exists and remove pagination parameters
- Verify `createManualFlashcard()` function exists
- Verify `updateFlashcard()` function exists
- Verify `deleteFlashcard()` function exists
- Ensure all functions have proper TypeScript typing

### Step 2: Create Pinia Store

Create the flashcards store following established patterns.

**File:** `frontend/src/features/flashcards/store.ts`

**Tasks:**

- Define store with `defineStore('flashcardsStore', () => { ... })`
- Create reactive state: `flashcards` array, `totalCount` number
- Create computed getters: `hasFlashcards`, `flashcardById`, etc.
- Implement `getFlashcards()` action
- Implement `createFlashcard()` action with list refresh
- Implement `updateFlashcard()` action with optimistic update
- Implement `deleteFlashcard()` action with optimistic update
- Implement `resetState()` action

### Step 3: Create Feature Directory Structure

Set up the flashcards feature module structure.

**Tasks:**

- Create `frontend/src/features/flashcards/` directory
- Create subdirectories: `views/`, `components/`
- Create `store.ts` in the feature root

### Step 4: Create EmptyState Component

Build the empty state display component.

**File:** `frontend/src/features/flashcards/components/EmptyState.vue`

**Tasks:**

- Implement template using Vuetify's `v-card`
- Add large icon (mdi-cards-outline)
- Add title and description text with i18n
- Add two action buttons (Create, Generate)
- Emit create event
- Use router to navigate to generate view

### Step 5: Create FlashcardCard Component

Build the individual flashcard card component.

**File:** `frontend/src/features/flashcards/components/FlashcardCard.vue`

**Tasks:**

- Define props interface accepting `Flashcard`
- Implement template using Vuetify's `v-card`
- Display question as card title (text-h6)
- Display answer as card text (text-body-2)
- Add source badge (v-chip) showing AI/Manual
- Add status badge (v-chip) showing Accepted/Edited
- Add card actions with Edit and Delete buttons
- Implement emit for edit and delete events
- Add hover elevation effect

### Step 6: Create FlashcardsList Component

Build the flashcards grid layout component.

**File:** `frontend/src/features/flashcards/components/FlashcardsList.vue`

**Tasks:**

- Define props interface accepting `flashcards` array
- Implement responsive grid with v-row and v-col
- Set breakpoints: cols="12" md="6" lg="4"
- Render FlashcardCard for each flashcard
- Pass flashcard data as props
- Forward edit and delete events to parent

### Step 7: Create DeleteConfirmDialog Component

Build the reusable delete confirmation dialog.

**File:** `frontend/src/components/dialogs/DeleteConfirmDialog.vue`

**Tasks:**

- Define props interface with v-model, title, message, button texts
- Implement v-dialog with max-width="400px"
- Add warning icon to title
- Display confirmation message
- Add Cancel button (closes dialog)
- Add Confirm button in error color (emits confirm event)
- Implement proper emit definitions

### Step 8: Create CreateEditFlashcardDialog Component

Build the create/edit flashcard dialog with validation.

**File:** `frontend/src/features/flashcards/components/CreateEditFlashcardDialog.vue`

**Tasks:**

- Define props interface with v-model, mode, flashcard
- Create local form state (question, answer)
- Implement validation rules for question (required, max 200)
- Implement validation rules for answer (required, max 500)
- Create v-dialog with v-card
- Add dynamic title based on mode
- Add v-textarea for question with counter and rules
- Add v-textarea for answer with counter and rules
- Add Cancel and Save buttons
- Implement save handler with form validation
- Implement cancel handler with form reset
- Watch props.flashcard to populate form in edit mode
- Watch dialog close to reset form

### Step 9: Create FlashcardsView

Build the main view component tying everything together.

**File:** `frontend/src/features/flashcards/views/FlashcardsView.vue`

**Tasks:**

- Import and use `useFlashcardsStore` and `useI18n`
- Import all child components
- Create local state for dialog visibility and selected flashcard
- Implement `onMounted` hook to fetch flashcards
- Create computed property for flashcards from store
- Create computed property for hasFlashcards
- Implement handleAddNew method
- Implement handleEdit method
- Implement handleDelete method
- Implement handleSave method (create or update)
- Implement handleConfirmDelete method
- Create template with header card and "Add New" button
- Conditionally render EmptyState or FlashcardsList
- Add CreateEditFlashcardDialog with proper bindings
- Add DeleteConfirmDialog with proper bindings

### Step 10: Update Route Configuration

Register the flashcards route in Vue Router.

**File:** `frontend/src/router/index.ts`

**Tasks:**

- Locate the flashcards route (currently placeholder)
- Update component import to use FlashcardsView
- Verify `meta: { requiresAuth: true }` is set
- Ensure route is within authenticated routes section

### Step 11: Add Translation Keys

Add i18n translation keys for all text content.

**Files:**

- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/pl.json`

**Tasks:**

- Add keys for page title
- Add keys for "Add New Flashcard" button
- Add keys for empty state (title, description, buttons)
- Add keys for flashcard card (edit, delete buttons)
- Add keys for create/edit dialog (titles, labels, buttons)
- Add keys for validation error messages
- Add keys for delete confirmation dialog
- Add keys for source and status badges
- Add keys for success/error notifications

### Step 12: Test Data Flow

Verify the complete implementation works end-to-end.

**Tasks:**

- Navigate to `/flashcards` while authenticated
- Verify empty state displays when no flashcards
- Click "Create Flashcard" and verify dialog opens
- Test form validation (empty fields, too long)
- Create a flashcard and verify it appears in list
- Verify success notification appears
- Click "Edit" on a flashcard and verify dialog opens with data
- Modify flashcard and save, verify update in list
- Click "Delete" on a flashcard and verify confirmation dialog
- Confirm delete and verify flashcard disappears
- Test language switching
- Test navigation to/from the page

### Step 13: Test Error Scenarios

Ensure error handling works as expected.

**Tasks:**

- Test with invalid/expired token (should redirect to login)
- Test with network disconnected (should show error notification)
- Test creating flashcard with validation errors
- Test editing non-existent flashcard (404)
- Test deleting already deleted flashcard
- Verify optimistic delete reverts on error
- Verify all error notifications appear via axios interceptor

### Step 14: Verify Accessibility

Ensure the view meets accessibility requirements.

**Tasks:**

- Verify all buttons have clear labels
- Test keyboard navigation (Tab, Enter, Escape)
- Verify form field labels are properly associated
- Check color contrast for all text
- Test with screen reader (basic verification)
- Verify dialogs trap focus properly
- Ensure empty state is informative

### Step 15: Code Review and Refinement

Final review and cleanup.

**Tasks:**

- Ensure code follows project conventions
- Verify TypeScript types are correctly applied throughout
- Check for any console errors or warnings
- Ensure consistent styling with other views
- Remove any unused imports or code
- Verify all computed properties and watchers are optimal
- Check for any memory leaks (event listeners, watchers)
- Ensure store state is properly managed and cleaned up
