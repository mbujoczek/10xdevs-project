# REST API Plan - AI Flashcard Generator

## 1. Resources

The API exposes the following main resources mapped to database tables:

| Resource           | Database Table                        | Description                                        |
| ------------------ | ------------------------------------- | -------------------------------------------------- |
| **Authentication** | Users                                 | User registration, login, and session management   |
| **Flashcards**     | Flashcards                            | CRUD operations for user flashcards                |
| **Generation**     | FlashcardGenerationEvents, Flashcards | AI-powered flashcard generation and review process |
| **Learning**       | Flashcards                            | Spaced repetition learning sessions                |
| **Statistics**     | FlashcardGenerationEvents             | User metrics and generation analytics              |

---

## 2. Endpoints

### 2.1. Authentication Endpoints

#### 2.1.1. Register New User

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Description:** Creates a new user account with username and password
- **Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "username": "string (required, max 50 chars, case-sensitive)",
  "password": "string (required, min 8 chars)"
}
```

**Success Response (201 Created):**

```json
{
  "id": 1,
  "username": "JohnDoe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "createdAtUtc": "2025-12-31T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed (password too short, username empty)

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

- `409 Conflict` - Username already exists

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Username already exists",
  "status": 409,
  "detail": "A user with the username 'JohnDoe' already exists."
}
```

---

#### 2.1.2. Login User

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Description:** Authenticates user and returns JWT token
- **Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "username": "string (required, case-sensitive)",
  "password": "string (required)"
}
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "username": "JohnDoe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-31T22:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Invalid credentials

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Invalid credentials",
  "status": 401,
  "detail": "The username or password is incorrect."
}
```

---

#### 2.1.3. Logout User

- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Description:** Invalidates the current JWT token (client-side token removal)
- **Authentication:** Required (Bearer token)

**Request Body:** None

**Success Response (204 No Content):**

- Empty body

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

---

### 2.2. Flashcard Generation Endpoints

#### 2.2.1. Generate Flashcards from Text

- **Method:** `POST`
- **Path:** `/api/flashcards/generate`
- **Description:** Sends text to AI model and generates flashcard candidates
- **Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "inputText": "string (required, max 10000 chars)",
  "language": "string (optional, values: 'pl' or 'en', default: 'en')"
}
```

**Success Response (201 Created):**

```json
{
  "generationEventId": 42,
  "candidatesCount": 8,
  "candidates": [
    {
      "candidateId": "temp-1",
      "question": "What is the capital of France?",
      "answer": "Paris"
    },
    {
      "candidateId": "temp-2",
      "question": "What is the largest planet in our solar system?",
      "answer": "Jupiter"
    }
  ],
  "createdAtUtc": "2025-12-31T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Input text exceeds 10,000 characters or is empty

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

- `401 Unauthorized` - Missing or invalid token
- `503 Service Unavailable` - AI service (Ollama) is not available

---

#### 2.2.2. Complete Flashcard Review

- **Method:** `POST`
- **Path:** `/api/flashcards/generation/{eventId}/complete`
- **Description:** Finalizes review process by saving accepted/edited flashcards and updating metrics
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `eventId` (integer, required) - Generation event identifier

**Request Body:**

```json
{
  "accepted": [
    {
      "candidateId": "temp-1",
      "question": "What is the capital of France?",
      "answer": "Paris"
    }
  ],
  "edited": [
    {
      "candidateId": "temp-2",
      "question": "Which planet is the largest in our solar system?",
      "answer": "Jupiter is the largest planet in our solar system."
    }
  ],
  "rejected": ["temp-3", "temp-4"]
}
```

**Success Response (200 OK):**

```json
{
  "savedFlashcardsCount": 2,
  "acceptedCount": 1,
  "editedCount": 1,
  "rejectedCount": 2,
  "flashcardIds": [101, 102]
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed (question/answer length exceeded)

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation error",
  "status": 400,
  "errors": {
    "edited[0].question": ["Question must not exceed 200 characters"],
    "edited[0].answer": ["Answer must not exceed 500 characters"]
  }
}
```

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Event belongs to different user
- `404 Not Found` - Generation event not found
- `409 Conflict` - Review already completed for this event

---

### 2.3. Flashcard Management Endpoints

#### 2.3.1. List User Flashcards

- **Method:** `GET`
- **Path:** `/api/flashcards`
- **Description:** Retrieves all active flashcards for the authenticated user
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `status` (integer, optional) - Filter by status (1=Accepted, 2=Edited). Multiple values supported.
  - `source` (integer, optional) - Filter by source (0=AI, 1=Manual)

**Success Response (200 OK):**

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
    },
    {
      "id": 102,
      "question": "What is TypeScript?",
      "answer": "TypeScript is a typed superset of JavaScript.",
      "source": 1,
      "status": 0,
      "srsNextRepetitionDate": null,
      "srsRepetitions": 0,
      "srsEaseFactor": 2.5,
      "createdAtUtc": "2025-12-25T08:00:00Z",
      "updatedAtUtc": "2025-12-25T08:00:00Z"
    }
  ],
  "totalCount": 2
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

---

#### 2.3.2. Get Single Flashcard

- **Method:** `GET`
- **Path:** `/api/flashcards/{id}`
- **Description:** Retrieves a single flashcard by ID
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `id` (integer, required) - Flashcard identifier

**Success Response (200 OK):**

```json
{
  "id": 101,
  "question": "What is the capital of France?",
  "answer": "Paris",
  "source": 0,
  "status": 1,
  "srsInterval": 7,
  "srsRepetitions": 3,
  "srsEaseFactor": 2.5,
  "srsNextRepetitionDate": "2025-12-31T10:00:00Z",
  "srsLastGrade": 4,
  "createdAtUtc": "2025-12-20T10:00:00Z",
  "updatedAtUtc": "2025-12-30T15:30:00Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Flashcard belongs to different user
- `404 Not Found` - Flashcard not found or deleted

---

#### 2.3.3. Create Manual Flashcard

- **Method:** `POST`
- **Path:** `/api/flashcards`
- **Description:** Creates a new flashcard manually
- **Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "question": "string (required, max 200 chars)",
  "answer": "string (required, max 500 chars)"
}
```

**Success Response (201 Created):**

```json
{
  "id": 103,
  "question": "What is Vue.js?",
  "answer": "Vue.js is a progressive JavaScript framework for building user interfaces.",
  "source": 1,
  "status": 0,
  "srsInterval": null,
  "srsRepetitions": 0,
  "srsEaseFactor": 2.5,
  "srsNextRepetitionDate": null,
  "srsLastGrade": null,
  "createdAtUtc": "2025-12-31T10:00:00Z",
  "updatedAtUtc": "2025-12-31T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation error",
  "status": 400,
  "errors": {
    "question": [
      "Question is required",
      "Question must not exceed 200 characters"
    ],
    "answer": ["Answer is required", "Answer must not exceed 500 characters"]
  }
}
```

- `401 Unauthorized` - Missing or invalid token

---

#### 2.3.4. Update Flashcard

- **Method:** `PUT`
- **Path:** `/api/flashcards/{id}`
- **Description:** Updates an existing flashcard's question and/or answer
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `id` (integer, required) - Flashcard identifier

**Request Body:**

```json
{
  "question": "string (required, max 200 chars)",
  "answer": "string (required, max 500 chars)"
}
```

**Success Response (200 OK):**

```json
{
  "id": 103,
  "question": "What is Vue 3?",
  "answer": "Vue 3 is the latest major version of Vue.js with Composition API support.",
  "source": 1,
  "status": 0,
  "srsInterval": null,
  "srsRepetitions": 0,
  "srsEaseFactor": 2.5,
  "srsNextRepetitionDate": null,
  "srsLastGrade": null,
  "createdAtUtc": "2025-12-31T10:00:00Z",
  "updatedAtUtc": "2025-12-31T10:30:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Flashcard belongs to different user
- `404 Not Found` - Flashcard not found or deleted

---

#### 2.3.5. Delete Flashcard

- **Method:** `DELETE`
- **Path:** `/api/flashcards/{id}`
- **Description:** Soft deletes a flashcard (sets Status to 3)
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `id` (integer, required) - Flashcard identifier

**Success Response (204 No Content):**

- Empty body

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Flashcard belongs to different user
- `404 Not Found` - Flashcard not found or already deleted

---

### 2.4. Learning Session Endpoints

#### 2.4.1. Get Due Flashcards

- **Method:** `GET`
- **Path:** `/api/learning/due`
- **Description:** Retrieves all flashcards due for review (where SRSNextRepetitionDate <= current UTC time)
- **Authentication:** Required (Bearer token)

**Success Response (200 OK):**

```json
{
  "flashcards": [
    {
      "id": 101,
      "question": "What is the capital of France?",
      "answer": "Paris",
      "srsRepetitions": 3,
      "srsEaseFactor": 2.5,
      "srsNextRepetitionDate": "2025-12-30T10:00:00Z"
    },
    {
      "id": 105,
      "question": "What does API stand for?",
      "answer": "Application Programming Interface",
      "srsRepetitions": 1,
      "srsEaseFactor": 2.5,
      "srsNextRepetitionDate": "2025-12-31T08:00:00Z"
    }
  ],
  "totalDueCount": 2
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

---

#### 2.4.2. Rate Flashcard

- **Method:** `POST`
- **Path:** `/api/learning/flashcards/{id}/rate`
- **Description:** Submits user rating for a flashcard and updates SRS algorithm parameters
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `id` (integer, required) - Flashcard identifier

**Request Body:**

```json
{
  "grade": "integer (required, 0-5)",
  "reviewedAtUtc": "string (optional, ISO 8601 datetime)"
}
```

**Grade Scale:**

- `0` - Complete blackout, no recall
- `1` - Incorrect response, but upon seeing the correct answer it felt familiar
- `2` - Incorrect response, but correct answer seemed easy to remember
- `3` - Correct response, but required significant effort to recall
- `4` - Correct response, with some hesitation
- `5` - Correct response, perfect recall

**Success Response (200 OK):**

```json
{
  "id": 101,
  "srsInterval": 14,
  "srsRepetitions": 4,
  "srsEaseFactor": 2.6,
  "srsNextRepetitionDate": "2026-01-14T10:00:00Z",
  "srsLastGrade": 5,
  "updatedAtUtc": "2025-12-31T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid grade value

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation error",
  "status": 400,
  "errors": {
    "grade": ["Grade must be between 0 and 5"]
  }
}
```

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Flashcard belongs to different user
- `404 Not Found` - Flashcard not found or deleted

---

### 2.5. Statistics Endpoints

#### 2.5.1. Get Generation Acceptance Rate

- **Method:** `GET`
- **Path:** `/api/statistics/generation-acceptance`
- **Description:** Retrieves global AI acceptance metrics from all system users for success tracking
- **Authentication:** Required (Bearer token)

**Success Response (200 OK):**

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

**Metric Definitions:**

- `acceptanceRate`: (acceptedWithoutEditing + acceptedAfterEditing) / totalCandidates
- `pureAcceptanceRate`: acceptedWithoutEditing / totalCandidates (primary PRD metric)
- `meetsSuccessMetric`: pureAcceptanceRate >= 0.75

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

**Type:** JSON Web Token (JWT) with Bearer authentication scheme

**Implementation:**

- User credentials are validated against hashed passwords stored in the database
- Upon successful authentication, a JWT token is issued containing:
  - `sub` (Subject): User ID
  - `username`: Username
  - `iat` (Issued At): Token creation timestamp
  - `exp` (Expiration): Token expiration timestamp (12 hours from issuance)
- Token is signed using HMAC-SHA256 algorithm with a secret key stored in application configuration
- Client includes token in Authorization header: `Authorization: Bearer {token}`

**Token Refresh:** Not implemented in MVP. Users must re-authenticate after token expiration.

### 3.2. Authorization Rules

**User Data Isolation:**

- All endpoints (except authentication) require valid JWT token
- UserId is extracted from JWT claims, never from request body or query parameters
- All database queries are automatically filtered by UserId from token
- Attempting to access another user's resources returns `403 Forbidden`

**Endpoint Authorization Matrix:**

| Endpoint                                           | Authentication Required | Authorization Logic             |
| -------------------------------------------------- | ----------------------- | ------------------------------- |
| POST /api/auth/register                            | No                      | Public                          |
| POST /api/auth/login                               | No                      | Public                          |
| POST /api/auth/logout                              | Yes                     | Any authenticated user          |
| POST /api/flashcards/generate                      | Yes                     | Own user data only              |
| POST /api/flashcards/generation/{eventId}/complete | Yes                     | Own generation events only      |
| GET /api/flashcards                                | Yes                     | Own flashcards only             |
| GET /api/flashcards/{id}                           | Yes                     | Own flashcards only             |
| POST /api/flashcards                               | Yes                     | Creates for own user only       |
| PUT /api/flashcards/{id}                           | Yes                     | Own flashcards only             |
| DELETE /api/flashcards/{id}                        | Yes                     | Own flashcards only             |
| GET /api/learning/due                              | Yes                     | Own flashcards only             |
| POST /api/learning/flashcards/{id}/rate            | Yes                     | Own flashcards only             |
| GET /api/statistics/generation-acceptance          | Yes                     | Global statistics for all users |

### 3.3. Security Headers

All API responses include the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS only)

---

## 4. Validation and Business Logic

### 4.1. Request Validation Rules

**Authentication Requests:**

- Username:
  - Required
  - Maximum 50 characters
  - Case-sensitive
  - Must be unique (enforced at database level with case-sensitive collation)
- Password:
  - Required
  - Minimum 8 characters
  - Hashed using bcrypt before storage (cost factor 10)

**Flashcard Requests:**

- Question:
  - Required
  - Maximum 200 characters
  - Must not be empty or whitespace only
- Answer:
  - Required
  - Maximum 500 characters
  - Must not be empty or whitespace only
- Source:
  - Must be 0 (AI) or 1 (Manual)
  - Automatically set based on creation method
- Status:
  - Valid values: 0 (Not applicable), 1 (Accepted), 2 (Edited), 3 (Deleted)
  - Status transitions are enforced by business logic

**Generation Requests:**

- Input Text:
  - Required
  - Maximum 10,000 characters
  - Minimum 50 characters (practical requirement for meaningful generation)
- Language:
  - Optional
  - Valid values: 'pl' (Polish), 'en' (English)
  - Default: 'en'

**Learning Requests:**

- Grade:
  - Required
  - Must be integer between 0 and 5 (inclusive)
  - Used by SM-2 algorithm to calculate next review interval

### 4.2. Business Logic Implementation

#### 4.2.1. Flashcard Generation Workflow

**Command:** `GenerateFlashcardsCommand`
**Handler:** `GenerateFlashcardsCommandHandler`

**Process:**

1. Validate input text length (50-10,000 characters)
2. Create `FlashcardGenerationEvent` record with initial state:
   - UserId from JWT claims
   - CandidatesCount = 0
   - AcceptedCount = 0
   - EditedCount = 0
3. Call Ollama API with structured prompt:

   ```
   Generate {n} flashcards from the following text in {language}.
   Return a JSON array with objects containing 'question' and 'answer' fields.

   Text: {inputText}
   ```

4. Parse JSON response and validate structure
5. Update `FlashcardGenerationEvent.CandidatesCount`
6. Return candidates with temporary IDs (not persisted yet)
7. Store candidates in distributed cache (Redis/Memory) with 30-minute expiration

**Error Handling:**

- Ollama API timeout (30 seconds): Return 503 Service Unavailable
- Invalid JSON response: Log error, return 502 Bad Gateway
- Zero candidates generated: Return 200 OK with empty array and warning message

#### 4.2.2. Review Completion Workflow

**Command:** `CompleteFlashcardReviewCommand`
**Handler:** `CompleteFlashcardReviewCommandHandler`

**Process:**

1. Validate that generation event exists and belongs to authenticated user
2. Check that event hasn't been completed already (prevent duplicate submissions)
3. Validate all questions and answers against length constraints
4. Begin database transaction
5. For each accepted flashcard:
   - Create `Flashcard` record with Source=0 (AI), Status=1 (Accepted)
   - Increment AcceptedCount
6. For each edited flashcard:
   - Create `Flashcard` record with Source=0 (AI), Status=2 (Edited)
   - Increment EditedCount
7. Update `FlashcardGenerationEvent` with final counts
8. Commit transaction
9. Clear cached candidates
10. Return summary with created flashcard IDs

**Business Rules:**

- Candidates can only be accepted/edited/rejected once
- Total of accepted + edited + rejected must equal candidatesCount
- Review completion is idempotent (subsequent calls return same result)

#### 4.2.3. Spaced Repetition Algorithm (SM-2)

**Command:** `RateFlashcardCommand`
**Handler:** `RateFlashcardCommandHandler`

**Algorithm Implementation:**
Uses SuperMemo SM-2 algorithm via open-source library (e.g., `SuperMemoAssistant.Interop` or custom implementation)

**Process:**

1. Retrieve flashcard and validate ownership
2. Extract current SRS parameters:
   - Interval (days since last review)
   - Repetitions count
   - Ease Factor (default 2.5)
3. Apply SM-2 algorithm based on grade:
   - Grade < 3: Reset repetitions to 0, interval to 1 day
   - Grade >= 3: Calculate new interval based on ease factor
   - Update ease factor: EF' = EF + (0.1 - (5 - grade) _ (0.08 + (5 - grade) _ 0.02))
4. Calculate next repetition date: CurrentDate + Interval
5. Update flashcard with new SRS parameters
6. Commit changes and return updated flashcard

**SM-2 Formula:**

- If grade < 3:
  - Interval = 1 day
  - Repetitions = 0
- If grade >= 3:
  - If repetitions = 0: Interval = 1 day
  - If repetitions = 1: Interval = 6 days
  - If repetitions > 1: Interval = Previous Interval × Ease Factor
  - Repetitions += 1

**Ease Factor Adjustment:**

- EF = EF + (0.1 - (5 - grade) × (0.08 + (5 - grade) × 0.02))
- Minimum EF: 1.3

#### 4.2.4. Soft Delete Implementation

**Command:** `DeleteFlashcardCommand`
**Handler:** `DeleteFlashcardCommandHandler`

**Process:**

1. Validate flashcard exists and belongs to user
2. Check current status:
   - If Status = 3 (already deleted): Return 404 Not Found
   - Otherwise: Update Status to 3 (Deleted)
3. Set UpdatedAtUtc to current UTC time
4. Commit changes
5. Return 204 No Content

**Business Rules:**

- Deleted flashcards are excluded from all list queries
- Deleted flashcards never appear in learning sessions
- Deleted flashcards retain SRS history for potential future analytics
- No hard delete functionality in MVP (can be added for GDPR compliance)

#### 4.2.5. Success Metrics Calculation

**Query:** `GetGenerationAcceptanceRateQuery`
**Handler:** `GetGenerationAcceptanceRateQueryHandler`

**Calculation:**

1. Retrieve all `FlashcardGenerationEvent` records from all system users
2. Sum totals:
   - Total Candidates: SUM(CandidatesCount)
   - Total Accepted: SUM(AcceptedCount)
   - Total Edited: SUM(EditedCount)
3. Calculate rates:
   - Pure Acceptance Rate = Total Accepted / Total Candidates
   - Overall Acceptance Rate = (Total Accepted + Total Edited) / Total Candidates
4. Compare Pure Acceptance Rate against target (0.75)
5. Return comprehensive metrics

**PRD Success Metrics:**

- **Primary Metric:** Pure Acceptance Rate >= 75%
  - Measures flashcards accepted without any edits
  - Formula: AcceptedCount / CandidatesCount >= 0.75
- **Secondary Metric:** AI Feature Adoption >= 75%
  - Measures ratio of AI-generated flashcards vs manual
  - Formula: (Flashcards with Source=0) / (Total Flashcards) >= 0.75

### 4.3. Error Handling Strategy

**Error Response Format (RFC 7807 Problem Details):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "See errors property for details.",
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"]
  },
  "traceId": "00-abc123-def456-00"
}
```

**HTTP Status Code Usage:**

- `200 OK` - Successful GET, PUT, POST with response body
- `201 Created` - Successful POST creating new resource
- `204 No Content` - Successful DELETE or POST with no response body
- `400 Bad Request` - Validation errors, malformed requests
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource doesn't exist or was deleted
- `409 Conflict` - Username already exists, duplicate submission
- `422 Unprocessable Entity` - Request is valid but business logic prevents processing
- `500 Internal Server Error` - Unexpected server errors
- `502 Bad Gateway` - Ollama API returned invalid response
- `503 Service Unavailable` - Ollama API is down or timeout

**Logging Strategy:**

- All errors logged to `Logs` table via Serilog
- Include correlation/trace ID in all responses for debugging
- Log levels:
  - Information: Successful operations with metrics
  - Warning: Validation failures, business rule violations
  - Error: Unexpected exceptions, external service failures
  - Critical: Database connection failures, authentication system errors

### 4.4. CQRS Pattern Implementation

**Commands (Write Operations):**

- `RegisterUserCommand`
- `LoginUserCommand`
- `GenerateFlashcardsCommand`
- `CompleteFlashcardReviewCommand`
- `CreateFlashcardCommand`
- `UpdateFlashcardCommand`
- `DeleteFlashcardCommand`
- `RateFlashcardCommand`

**Queries (Read Operations):**

- `GetFlashcardsQuery`
- `GetFlashcardByIdQuery`
- `GetGenerationCandidatesQuery`
- `GetDueFlashcardsQuery`
- `GetUserStatisticsQuery`
- `GetGenerationAcceptanceRateQuery`

**MediatR Pipeline Behaviors:**

- `ValidationBehavior<TRequest, TResponse>` - Validates requests using FluentValidation
- `LoggingBehavior<TRequest, TResponse>` - Logs all commands/queries with timing
- `TransactionBehavior<TRequest, TResponse>` - Wraps commands in database transactions
- `AuthorizationBehavior<TRequest, TResponse>` - Validates user ownership of resources

---

## 5. API Versioning

**Strategy:** URI Path Versioning

**Current Version:** v1 (implicit in `/api/` prefix)

**Future Versioning:** When breaking changes are introduced, use `/api/v2/` prefix

---

## 6. CORS Configuration

**Allowed Origins:**

- Development: `http://localhost:5173` (Vite dev server)
- Production: Configured via environment variable

**Allowed Methods:**

- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**

- Authorization, Content-Type, Accept

**Exposed Headers:**

- Content-Length, X-RateLimit-\*

**Credentials:** Allowed (for potential future cookie-based features)

---

## 7. API Documentation

**Tool:** Swagger/OpenAPI 3.0

**Endpoints:**

- Development: `http://localhost:5000/swagger`
- Production: `/swagger` (optionally disabled in production)

**Features:**

- Interactive API testing
- Request/response examples
- Authentication flow with JWT token input
- Schema definitions for all DTOs
- Error response examples

---

## 8. Performance Considerations

### 8.1. Database Query Optimization

**Indexed Queries:**

- List flashcards by user: Uses `IX_Flashcards_UserId`
- Get due flashcards: Uses `IX_Flashcards_SRSNextRepetitionDate` combined with `IX_Flashcards_UserId`
- Get active flashcards: Uses `IX_Flashcards_UserId_Status`

**Query Patterns:**

- All flashcard queries include `WHERE UserId = @UserId AND Status != 3`
- Learning queries add `AND SRSNextRepetitionDate <= GETUTCDATE()`
- Use `AsNoTracking()` for read-only queries

---

## 9. Deployment and Environment Configuration

### 9.1. Environment Variables

**Required Configuration:**

```
# Database
ConnectionStrings__DefaultConnection=Server=...;Database=...

# JWT
Jwt__Secret=<secret-key>
Jwt__Issuer=10xdevs-api
Jwt__Audience=10xdevs-client
Jwt__ExpirationHours=12

# Ollama
Ollama__BaseUrl=http://localhost:11434
Ollama__Model=llama3
Ollama__TimeoutSeconds=30

# Serilog
Serilog__MinimumLevel=Information

# CORS
Cors__AllowedOrigins=http://localhost:5173
```
