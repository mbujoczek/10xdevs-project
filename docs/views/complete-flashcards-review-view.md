# Complete Flashcards Review View Implementation Plan

## 1. Overview

The Complete Flashcards Review View allows users to review AI-generated flashcard candidates and decide which ones to save. Users can accept candidates as-is, edit them before saving, or reject them entirely. The view provides a streamlined interface for bulk flashcard management with real-time status tracking. State is managed in a dedicated Pinia store (generation.store.ts) and is ephemeral - it persists only until the review is completed or cancelled. Each candidate action (accept/edit/reject) requires user confirmation via a dialog, and after confirmation, the candidate status is locked (buttons disabled). Upon successful completion, all decisions are sent to the backend in a single API call, and users are redirected to the flashcard list view.

## 2. View Routing

- **View Name**: `ReviewView.vue`
- **Route Path**: `/review/:eventId`
- **Route Name**: `review`
- **Route Protection**: Protected (requires authentication)
- **Route Parameters**: `eventId` (number) - Generation event identifier from previous step
- **Layout**: `DefaultLayout.vue`
- **Navigation Guard**: `requireAuth` - redirects to `/login` if user is not authenticated

## 3. Component Structure

```
ReviewView.vue
├── DefaultLayout.vue (wrapper)
│   ├── TheHeader.vue
│   └── TheFooter.vue
└── View Content
    ├── VContainer
    │   ├── ReviewHeader
    │   │   ├── PageTitle (h1)
    │   │   └── ReviewSummary (stats)
    │   ├── CandidatesList
    │   │   └── CandidateCard (v-for)
    │   │       ├── VCard (with status styling)
    │   │       ├── CardContent (question/answer)
    │   │       └── CardActions
    │   │           ├── BaseButton (Accept) - disabled after confirmation
    │   │           ├── BaseButton (Edit) - disabled after confirmation
    │   │           └── BaseButton (Reject) - disabled after confirmation
    │   └── ReviewFooter
    │       └── BaseButton (Finish Review)
    ├── CandidateConfirmDialog
    │   ├── VDialog
    │   ├── VCardTitle (confirmation message)
    │   ├── VCardText (action details)
    │   └── DialogActions
    │       ├── BaseButton (Cancel)
    │       └── BaseButton (Confirm)
    └── EditCandidateDialog
        ├── VDialog
        ├── VTextField (question)
        ├── VTextarea (answer)
        └── DialogActions
            ├── BaseButton (Cancel)
            └── BaseButton (Save)
```

## 4. Component Details

### 4.1. ReviewView.vue (Main View Component)

**Description**:
Main view component that manages the flashcard review process. Uses Pinia store (generation.store.ts) to manage review session state. Fetches generation event data from route params, displays list of candidates, shows confirmation dialogs for all actions, tracks user decisions (accept/edit/reject), and submits final review to API. After action confirmation, candidate buttons are disabled to prevent further changes. Loading and error states are managed globally by axios interceptor.

**Main Elements**:

- `VContainer` - Main container with responsive padding
- Review Header - Page title and statistics summary
- Candidates List - Scrollable list of flashcard candidates with VCards
- Review Footer - Fixed bottom section with "Finish Review" button
- Confirmation Dialog - Modal for confirming candidate actions
- Edit Dialog - Modal for editing candidate content

**Handled Events**:

- Candidate action triggers: Accept, Edit, Reject (open confirmation dialog)
- Confirmation dialog: Confirm, Cancel
- Edit dialog: Open, Close, Save
- Finish review: Submit all decisions to API, reset store

**Validation Conditions**:

1. **Question Length**: Max 200 characters (enforced in edit dialog)
2. **Answer Length**: Max 500 characters (enforced in edit dialog)
3. **At least one action**: User must take action on at least one candidate before finishing
4. **Event ID validity**: Must be valid number from route params

**Types**:

- `FlashcardCandidate` (already defined in flashcards.types.ts)
- `CompleteReviewRequest` (already defined in flashcards.types.ts)
- `CompleteReviewResponse` (already defined in flashcards.types.ts)
- `CandidateStatus` (local enum: 'pending' | 'accepted' | 'edited' | 'rejected')

**Props**: None (top-level view component)

### 4.2. CandidateCard Component

**Description**:
Displays a single flashcard candidate with question, answer, and action buttons. Visual styling changes based on candidate status (pending/accepted/edited/rejected) using Vuetify card variants and colors. After a candidate action is confirmed, all action buttons for that candidate are disabled to prevent further modifications (state locking).

**Main Elements**:

- `VCard` - Card container with status-based styling
- `VCardTitle` - Question display
- `VCardText` - Answer display
- `VCardActions` - Action buttons row (conditionally disabled)

**Handled Events**:

- `@click:accept` - Emits accept event to parent (triggers confirmation dialog)
- `@click:edit` - Emits edit event to parent (opens edit dialog, then triggers confirmation)
- `@click:reject` - Emits reject event to parent (triggers confirmation dialog)

**Button Disabling Logic**:

- All three action buttons (Accept, Edit, Reject) are enabled when `status === 'pending'`
- All three buttons become disabled when `status !== 'pending'` (after confirmation)
- This prevents users from changing decisions after confirmation
- Visual indication: disabled buttons with Vuetify disabled state styling

**Validation Conditions**: None (validation happens in edit dialog)

**Visual Status Indicators**:

- **Pending**: Default card style (neutral), buttons enabled
- **Accepted**: Green border/background tint (success color), buttons disabled
- **Edited**: Yellow/amber border/background tint (warning color), buttons disabled
- **Rejected**: Red border/background tint (error color), semi-transparent, buttons disabled

**Types**: `FlashcardCandidate`, `CandidateStatus`

**Props**:

- `candidate: FlashcardCandidate` - Candidate data
- `status: CandidateStatus` - Current status for styling and button state

**Emits**:

- `accept` - User clicked accept (before confirmation)
- `edit` - User clicked edit (before confirmation)
- `reject` - User clicked reject (before confirmation)

### 4.3. CandidateConfirmDialog Component

**Description**:
Modal confirmation dialog shown before applying any candidate action (accept/edit/reject). Requires explicit user confirmation to proceed with the action. After confirmation, the candidate status is locked and cannot be changed. This prevents accidental actions and ensures intentional review decisions.

**Main Elements**:

- `VDialog` - Modal overlay
- `VCard` - Dialog content container
- `VCardTitle` - Dialog title (e.g., "Confirm Action")
- `VCardText` - Confirmation message with action details
  - For Accept: "Are you sure you want to accept this flashcard?"
  - For Edit: "Are you sure you want to save these changes?"
  - For Reject: "Are you sure you want to reject this flashcard?"
- `VCardActions` - Action buttons (Cancel, Confirm)

**Handled Events**:

- `@click:cancel` - Close dialog without confirming
- `@click:confirm` - Emit confirm event to apply action

**Validation Conditions**: None (action already validated before opening dialog)

**Types**: `CandidateStatus`, `ConfirmAction` (type for action being confirmed)

**Props**:

- `modelValue: boolean` - Dialog visibility (v-model)
- `action: 'accept' | 'edit' | 'reject'` - Action being confirmed
- `candidate: FlashcardCandidate` - Candidate related to action

**Emits**:

- `update:modelValue` - Dialog visibility change
- `confirm` - User confirmed action

### 4.4. EditCandidateDialog Component

**Description**:
Modal dialog for editing flashcard question and answer. Enforces length constraints (question: 200, answer: 500 characters). Uses Vuetify text field and textarea with built-in counters and validation. After saving edits, a confirmation dialog is shown before applying the "edited" status.

**Main Elements**:

- `VDialog` - Modal overlay
- `VCard` - Dialog content container
- `VCardTitle` - Dialog title ("Edit Flashcard")
- `VCardText` - Form fields container
  - `VTextField` - Question input with counter
  - `VTextarea` - Answer input with counter
- `VCardActions` - Action buttons (Cancel, Save)

**Handled Events**:

- `@click:cancel` - Close dialog without saving
- `@click:save` - Validate and emit save event (triggers confirmation)

**Validation Conditions**:

1. **Question Required**: Not empty after trim
2. **Question Length**: 1-200 characters
3. **Answer Required**: Not empty after trim
4. **Answer Length**: 1-500 characters

**Types**: `FlashcardCandidate`

**Props**:

- `modelValue: boolean` - Dialog visibility (v-model)
- `candidate: FlashcardCandidate | null` - Candidate being edited

**Emits**:

- `update:modelValue` - Dialog visibility change
- `save` - Edited candidate data `{ question: string, answer: string }`

## 5. Types

All main types are already defined in `frontend/src/types/flashcards.types.ts`:

- `FlashcardCandidate` - Candidate structure with `candidateId`, `question`, `answer`
- `CompleteReviewRequest` - Request DTO with `accepted` and `edited` arrays
- `CompleteReviewResponse` - Response DTO with counts and `flashcardIds`

**Additional Local Types**:

```typescript
// Local candidate status for UI state management
type CandidateStatus = 'pending' | 'accepted' | 'edited' | 'rejected';

// Extended candidate with local state
interface CandidateWithStatus extends FlashcardCandidate {
  status: CandidateStatus;
  originalQuestion?: string; // For edited candidates
  originalAnswer?: string; // For edited candidates
}
```

## 6. State Management

### 6.1. Pinia Store (generation.store.ts)

**Store Location**: `frontend/src/features/generation/store/generation.store.ts`

**Description**:
Dedicated Pinia store for managing the flashcard generation review session. Store maintains ephemeral state that persists only during the review process and is reset after completion or cancellation. This centralized state management ensures consistent behavior and prevents state loss during component re-renders.

**State Variables**:

- `eventId: number | null` - Generation event identifier
- `candidates: CandidateWithStatus[]` - Array of candidates with review status
- `editDialogVisible: boolean` - Edit dialog visibility flag
- `confirmDialogVisible: boolean` - Confirmation dialog visibility flag
- `candidateBeingEdited: FlashcardCandidate | null` - Currently edited candidate
- `pendingAction: { candidateId: number, action: 'accept' | 'edit' | 'reject' } | null` - Action awaiting confirmation

**Getters**:

- `reviewStats` - Computed counts: accepted, edited, rejected, pending
- `hasAnyAction` - True if at least one candidate has non-pending status
- `acceptedCandidates` - Filtered array of candidates with status 'accepted'
- `editedCandidates` - Filtered array of candidates with status 'edited'
- `rejectedCount` - Count of rejected candidates
- `canFinishReview` - True if at least one action taken

**Actions**:

- `initializeReview(eventId, candidates)` - Set up new review session
- `requestAccept(candidateId)` - Trigger confirmation dialog for accept action
- `requestEdit(candidateId)` - Open edit dialog for candidate
- `requestReject(candidateId)` - Trigger confirmation dialog for reject action
- `confirmAction()` - Apply pending action (after confirmation), lock candidate status
- `cancelAction()` - Cancel pending action, close confirmation dialog
- `saveEdit(candidateId, editedData)` - Save edited content and trigger confirmation
- `updateCandidateStatus(candidateId, status)` - Update candidate status (internal)
- `buildReviewRequest()` - Build CompleteReviewRequest payload from current state
- `resetStore()` - Clear all state after review completion or cancellation

**Store Lifecycle**:

1. **Initialization**: `initializeReview()` called when entering review view
2. **During Review**: Actions update candidate statuses with confirmation flow
3. **Completion**: After successful API call, `resetStore()` clears all data
4. **Cancellation**: If user navigates away, `resetStore()` ensures clean state

### 6.2. Component State

**Local Component State** (ReviewView.vue):

- Minimal local state - most managed in Pinia store
- Component mainly reads from store via computed properties
- Uses store actions for all state mutations

**Loading and Error States**: Managed globally by axios interceptor

### 6.3. State Flow

1. **Component Mount**:

   - Extract `eventId` from route params
   - Retrieve candidates from router state (passed from Generate view)
   - Call `store.initializeReview(eventId, candidates)` to set up session
   - All candidates initialized with `status: 'pending'`

2. **User Actions with Confirmation Flow**:

   - **Accept Click**:

     - Call `store.requestAccept(candidateId)`
     - Store sets `pendingAction` and opens confirmation dialog
     - User confirms → `store.confirmAction()` → status set to 'accepted', buttons disabled
     - User cancels → `store.cancelAction()` → no change

   - **Edit Click**:

     - Call `store.requestEdit(candidateId)`
     - Store opens edit dialog with candidate data
     - User saves → `store.saveEdit(candidateId, editedData)` → opens confirmation dialog
     - User confirms → status set to 'edited', buttons disabled
     - User cancels edit or confirmation → no change

   - **Reject Click**:
     - Call `store.requestReject(candidateId)`
     - Store sets `pendingAction` and opens confirmation dialog
     - User confirms → `store.confirmAction()` → status set to 'rejected', buttons disabled
     - User cancels → `store.cancelAction()` → no change

3. **Status Locking**:

   - After `confirmAction()` executes, candidate status is permanently set
   - Buttons for that candidate are disabled (checked via `status !== 'pending'`)
   - User cannot change decision for that candidate
   - Visual indication through disabled buttons and status styling

4. **Finish Review**:

   - User clicks "Finish Review" button
   - Component calls `store.buildReviewRequest()` to get payload
   - API call made with `eventId` and request body
   - On success:
     - `store.resetStore()` clears all session data
     - Navigate to flashcard list view (`/flashcards`)
   - On error: Display via axios interceptor, store remains intact for retry

5. **Navigation/Cancellation**:
   - If user navigates away before finishing
   - beforeRouteLeave guard shows confirmation if `store.hasAnyAction`
   - On leave confirmation: `store.resetStore()` clears session
   - On stay: User remains in review view with state intact

## 7. API Integration

### 7.1. Endpoint Details

**Endpoint**: `POST /api/flashcards/generation/{eventId}/complete`  
**Authentication**: Required (Bearer token automatically added by axios interceptor)  
**Request Content-Type**: `application/json`

### 7.2. Request Structure

Build request from local state:

- `accepted` - Array of candidates with `status === 'accepted'` (use original question/answer)
- `edited` - Array of candidates with `status === 'edited'` (use modified question/answer)
- Rejected candidates are not sent (implicit rejection - counted server-side)

### 7.3. API Function Location

Create/use function in `frontend/src/api/flashcards.api.ts`:

- Import axios instance from `./axios`
- Make POST request to `/api/flashcards/generation/${eventId}/complete`
- Return typed response: `CompleteReviewResponse`

### 7.4. Response Handling

**Success Response (200 OK)**:

- Navigate to flashcard list view (`/flashcards`)
- Optionally show success notification with saved count
- Axios interceptor automatically stops loading indicator

**Error Responses**:
All errors automatically handled by axios interceptor:

- **400 Bad Request** - Validation errors (question/answer too long)
- **401 Unauthorized** - Should trigger redirect to login
- **403 Forbidden** - Event belongs to different user
- **404 Not Found** - Generation event not found
- **409 Conflict** - Review already completed for this event

**Component Error Handling**:

- Validate locally before API call (question/answer lengths)
- Check that at least one action was taken
- All API errors handled by interceptor

## 8. User Interactions

### 8.1. Accepting a Candidate

**Action**: User clicks "Accept" button on a candidate card

**Flow**:

1. User clicks "Accept" on candidate
2. Confirmation dialog opens asking "Are you sure you want to accept this flashcard?"
3. User has two options:
   - **Cancel**: Dialog closes, no change to candidate status
   - **Confirm**: Dialog closes, proceed to step 4
4. Store updates candidate status to 'accepted'
5. Card visual styling updates (green border/tint)
6. All action buttons on that card become disabled (status locked)
7. Stats counter updates (accepted count +1, pending count -1)
8. "Finish Review" button remains enabled

**Expected Outcome**:

- Visual confirmation via card styling and disabled buttons
- Candidate status is permanently locked (cannot be changed)
- Candidate will be saved as-is when review finalized

### 8.2. Editing a Candidate

**Action**: User clicks "Edit" button on a candidate card

**Flow**:

1. User clicks "Edit" on candidate
2. Edit dialog opens with pre-filled question and answer
3. User modifies text in form fields
4. Character counters update in real-time
5. User clicks "Save":
   - Validation runs (lengths, required fields)
   - If valid: Edit dialog closes, confirmation dialog opens
   - If invalid: Error messages shown, dialog remains open
6. Confirmation dialog asks "Are you sure you want to save these changes?"
7. User has two options:
   - **Cancel**: Dialog closes, edited content discarded, candidate remains pending
   - **Confirm**: Dialog closes, proceed to step 8
8. Store updates candidate with edited content and status 'edited'
9. Card displays edited content with yellow border/tint
10. All action buttons on that card become disabled (status locked)
11. Stats counter updates (edited count +1, pending count -1)
12. Alternatively, user can click "Cancel" in edit dialog to discard changes without confirmation

**Expected Outcome**:

- Edited content displayed on card
- Visual confirmation via yellow styling and disabled buttons
- Candidate status is permanently locked (cannot be changed)
- Candidate saved with modifications when review finalized

### 8.3. Rejecting a Candidate

**Action**: User clicks "Reject" button on a candidate card

**Flow**:

1. User clicks "Reject" on candidate
2. Confirmation dialog opens asking "Are you sure you want to reject this flashcard?"
3. User has two options:
   - **Cancel**: Dialog closes, no change to candidate status
   - **Confirm**: Dialog closes, proceed to step 4
4. Store updates candidate status to 'rejected'
5. Card visual styling updates (red border/tint, semi-transparent)
6. All action buttons on that card become disabled (status locked)
7. Stats counter updates (rejected count +1, pending count -1)
8. Card remains visible but visually muted

**Expected Outcome**:

- Visual confirmation via red/muted styling and disabled buttons
- Candidate status is permanently locked (cannot be changed)
- Candidate will not be saved when review finalized

### 8.4. Finishing Review

**Action**: User clicks "Finish Review" button

**Flow**:

1. User clicks "Finish Review" button at bottom of page
2. Client-side validation:
   - Check if at least one action taken (via `store.hasAnyAction`)
   - If none: Show warning "Please review at least one flashcard"
3. If valid:
   - Get request payload from `store.buildReviewRequest()`
   - API request sent to `/api/flashcards/generation/{eventId}/complete`
   - Axios interceptor shows global loading indicator
4. On success:
   - Call `store.resetStore()` to clear all session data
   - Loading indicator hidden automatically
   - Navigate to flashcard list view (`/flashcards`)
   - Optionally show success message with count of saved flashcards
5. On error:
   - Loading indicator hidden automatically
   - Error notification displayed automatically
   - Store remains intact (user can retry or continue reviewing)

**Expected Outcome**:

- Successful save → Store reset, redirect to flashcard list
- Error → Notification displayed, store intact, user can retry

### 8.5. Navigation Away Warning

**Action**: User attempts to navigate away without finishing review

**Flow**:

1. User clicks browser back button or navigation link
2. `beforeRouteLeave` guard checks if `store.hasAnyAction` is true
3. If there are pending candidates with actions (status changed):
   - Show confirmation dialog: "You have unsaved changes. Are you sure you want to leave?"
   - User has two options:
     - **Stay**: Cancel navigation, remain in review view
     - **Leave**: Confirm navigation, proceed to step 4
4. If user confirms leaving:
   - Call `store.resetStore()` to clear session data
   - Allow navigation to proceed
5. If no actions taken: Allow navigation without warning (no store reset needed as state is empty)

**Expected Outcome**:

- Prevents accidental loss of review progress
- User makes conscious decision to abandon review
- Store is properly reset when leaving to ensure clean state

## 9. Conditions and Validation

### 9.1. Client-Side Validation

#### 9.1.1. Edit Dialog Validation

**Question Field**:

- **Required**: `question.trim().length > 0`
- **Max Length**: `question.length <= 200`
- **Error Messages**:
  - "Question is required"
  - "Question must not exceed 200 characters"
- **UI Impact**: Save button disabled if invalid, error shown below field

**Answer Field**:

- **Required**: `answer.trim().length > 0`
- **Max Length**: `answer.length <= 500`
- **Error Messages**:
  - "Answer is required"
  - "Answer must not exceed 500 characters"
- **UI Impact**: Save button disabled if invalid, error shown below field

**Save Button State**:

- Disabled if question or answer invalid
- Enabled only when both fields valid

#### 9.1.2. Review Completion Validation

**At Least One Action**:

- **Condition**: At least one candidate must have `status !== 'pending'`
- **Error Message**: "Please review at least one flashcard before finishing"
- **UI Impact**: Show validation message, prevent API call

**Event ID Presence**:

- **Condition**: `eventId` must be present in route params
- **Error Handling**: If missing, redirect to generate page or show error

### 9.2. Server-Side Validation

Backend validation errors handled via axios interceptor:

**Question/Answer Lengths**:

- **Backend Rule**: Question <= 200, Answer <= 500 characters
- **Response**: 400 Bad Request with field-specific errors
- **UI Handling**: Error notification displayed automatically

**Event Ownership**:

- **Backend Rule**: Event must belong to authenticated user
- **Response**: 403 Forbidden
- **UI Handling**: Error notification, redirect to list

**Event Existence**:

- **Backend Rule**: Generation event must exist
- **Response**: 404 Not Found
- **UI Handling**: Error notification, redirect to generate

**Already Completed**:

- **Backend Rule**: Event cannot be completed twice
- **Response**: 409 Conflict
- **UI Handling**: Error notification, redirect to flashcard list

## 10. Error Handling

### 10.1. Global Error Handling (Axios Interceptor)

All API errors automatically handled by axios interceptor:

- Loading indicators managed automatically
- Error notifications displayed via `useNotifications().showError()`
- Validation errors parsed and shown

### 10.2. Component-Level Error Handling

**Missing Generation Data**:

- If component mounts without candidates data (e.g., page refresh)
- **Scenario**: User navigates directly to `/review/:eventId` or refreshes page
- **Handling**:
  - Check if candidates exist in router state
  - If not: Show error message and redirect to `/generate`
  - Or: Fetch candidates from backend if API supports it

**Invalid Event ID**:

- If `eventId` route param is invalid (not a number)
- **Handling**: Show error message and redirect to `/generate`

**Edit Dialog Validation Errors**:

- Display inline error messages using Vuetify field error states
- Disable save button until all fields valid

**Empty Review Submission**:

- If user tries to finish without any actions
- **Handling**: Show local validation message, prevent API call

## 11. Implementation Steps

### Step 1: Create Pinia Store

**Action**: Create `frontend/src/features/generation/store/generation.store.ts`
**Details**:

- Import `defineStore` from Pinia
- Import types from `flashcards.types.ts`
- Define state interface with all required fields
- Implement all getters (reviewStats, hasAnyAction, acceptedCandidates, etc.)
- Implement all actions:
  - `initializeReview(eventId, candidates)` - Set up session
  - `requestAccept/Edit/Reject(candidateId)` - Trigger confirmation flow
  - `confirmAction()` - Apply pending action after confirmation
  - `cancelAction()` - Cancel pending action
  - `saveEdit(candidateId, editedData)` - Save edits and trigger confirmation
  - `buildReviewRequest()` - Build API request payload
  - `resetStore()` - Clear all state
- Use `$reset()` or manual reset logic in `resetStore()`

### Step 2: Create API Function

**Action**: Add function to `frontend/src/api/flashcards.api.ts`
**Details**:

- Import axios instance from `./axios`
- Create `completeFlashcardReview()` function
- Accept `eventId: number` and `request: CompleteReviewRequest`
- Return `CompleteReviewResponse` type
- POST to `/api/flashcards/generation/${eventId}/complete`

### Step 3: Create View Component File

**Action**: Create `frontend/src/features/generation/views/ReviewView.vue`
**Details**:

- Use `<script setup lang="ts">`
- Import necessary composables: `useRouter`, `useRoute`, `useI18n`
- Import store: `import { useGenerationStore } from '../store/generation.store'`
- Import API function from `flashcards.api.ts`
- Import types from `flashcards.types.ts`
- Initialize store instance: `const store = useGenerationStore()`

### Step 4: Implement Component Initialization

**Action**: Set up component mount logic
**Details**:

- Get `eventId` from route params
- Retrieve candidates from router state (passed from Generate view)
- Call `store.initializeReview(eventId, candidates)` in `onMounted` hook
- Add error handling if candidates missing (redirect to generate)
- Use computed properties to read from store (e.g., `computed(() => store.candidates)`)

### Step 5: Implement Candidate Action Handlers

**Action**: Create handler functions that call store actions
**Details**:

- `handleAcceptClick(candidateId)` - Calls `store.requestAccept(candidateId)`
- `handleEditClick(candidateId)` - Calls `store.requestEdit(candidateId)`
- `handleRejectClick(candidateId)` - Calls `store.requestReject(candidateId)`
- These handlers trigger confirmation dialogs via store

### Step 6: Implement Confirmation Dialog

**Action**: Create `CandidateConfirmDialog.vue` component
**Details**:

- Accept `modelValue` (v-model for visibility)
- Accept `action` prop ('accept' | 'edit' | 'reject')
- Accept `candidate` prop
- Display appropriate confirmation message based on action
- Emit `confirm` event when user confirms
- Emit `update:modelValue` to close dialog
- Use Vuetify VDialog, VCard, VCardTitle, VCardText, VCardActions

### Step 7: Implement Edit Dialog

**Action**: Create `EditCandidateDialog.vue` component
**Details**:

- Accept `modelValue` (v-model for visibility)
- Accept `candidate` prop
- VTextField for question with maxlength="200" and counter
- VTextarea for answer with maxlength="500" and counter
- Validation logic for required fields and lengths
- Emit `save` event with edited data (triggers confirmation in parent)
- Emit `update:modelValue` to close dialog

### Step 8: Implement Confirmation Flow in View

**Action**: Wire up confirmation dialog events
**Details**:

- Bind confirmation dialog visibility to `store.confirmDialogVisible`
- Pass `store.pendingAction` data to dialog
- On confirm: Call `store.confirmAction()` to apply action and lock status
- On cancel: Call `store.cancelAction()` to reset pending action
- For edit flow: Save dialog emits → store.saveEdit() → confirmation dialog opens

### Step 9: Implement Review Completion

**Action**: Create `handleFinishReview()` function
**Details**:

- Check `store.canFinishReview` before proceeding
- If false: Show validation message
- If true:
  - Get payload via `store.buildReviewRequest()`
  - Call API function with `eventId` and payload
  - On success:
    - Call `store.resetStore()` to clear session
    - Navigate to `/flashcards`
    - Show success notification (optional)
  - On error: handled by axios interceptor, store remains intact

### Step 10: Build Template Structure

**Action**: Create template with Vuetify components
**Details**:

- `VContainer` with responsive layout
- Review header with title and stats (read from store.reviewStats)
- List of candidate cards using `v-for` over `store.candidates`
- Each card shows question, answer, and action buttons (disabled based on status)
- Status-based styling using computed classes or Vuetify variants
- Confirmation dialog component
- Edit dialog component
- Fixed footer with "Finish Review" button

### Step 11: Implement Candidate Card Component

**Action**: Create `CandidateCard.vue` component in components folder
**Details**:

- Accept `candidate` and `status` props
- `VCard` with conditional styling based on status
- Display question as card title
- Display answer as card text
- Three action buttons: Accept, Edit, Reject
- **Critical**: Bind `:disabled="status !== 'pending'"` to all three buttons
- This ensures buttons are disabled after confirmation (status locked)
- Emit events for each action (only when enabled)
- Use Vuetify color classes for status indicators
- Visual states:
  - Pending: default style, buttons enabled
  - Accepted: green border/tint, buttons disabled
  - Edited: yellow border/tint, buttons disabled
  - Rejected: red border/tint, semi-transparent, buttons disabled

### Step 12: Add Route Definition

**Action**: Update `frontend/src/router/index.ts`
**Details**:

- Path: `/review/:eventId`
- Name: `review`
- Component: lazy-loaded `ReviewView.vue`
- Props: `true` (to pass route params as props)
- Meta: `requiresAuth: true`, `layout: 'default'`

### Step 13: Implement Navigation Guard

**Action**: Add beforeRouteLeave guard to ReviewView
**Details**:

- Check `store.hasAnyAction` in guard
- If true (unsaved changes): Show confirmation dialog
- If user confirms leaving: Call `store.resetStore()` before allowing navigation
- If user cancels: Return false to prevent navigation
- If false (no changes): Allow navigation without confirmation
- Use Vuetify VDialog for confirmation or built-in browser confirm

### Step 14: Add i18n Translations

**Action**: Add translations to `frontend/src/i18n/locales/en.json` and `pl.json`
**Details**:

- Page title and instructions
- Button labels (Accept, Edit, Reject, Finish Review, Cancel, Save, Confirm)
- Stats labels (Accepted, Edited, Rejected, Pending)
- Validation error messages
- Confirmation dialog messages for each action:
  - "Are you sure you want to accept this flashcard?"
  - "Are you sure you want to save these changes?"
  - "Are you sure you want to reject this flashcard?"
- Navigation away warning: "You have unsaved changes. Are you sure you want to leave?"
- Success/error messages

### Step 15: Handle Data Passing from Generate View

**Action**: Update Generate view to pass candidates to Review view
**Details**:

- After successful generation, navigate with router state
- Pass candidates array and eventId via `router.push({ name: 'review', params: { eventId }, state: { candidates } })`
- Review view reads from `router.currentRoute.value.state.candidates`
- If state missing (refresh/direct navigation): Show error and redirect to `/generate`
- Alternative: Store eventId in store temporarily and fetch candidates if needed

### Step 16: Test State Locking Mechanism

**Action**: Verify confirmation and button disabling work correctly
**Details**:

- Test that clicking Accept/Edit/Reject opens confirmation dialog
- Test that clicking Confirm in dialog:
  - Updates candidate status
  - Disables all three action buttons for that candidate
  - Updates card visual styling
  - Updates stats counters
- Test that clicking Cancel in dialog:
  - Closes dialog without changes
  - Candidate remains in pending state
  - Buttons remain enabled
- Test that disabled buttons cannot be clicked
- Test that store.resetStore() clears all state properly
