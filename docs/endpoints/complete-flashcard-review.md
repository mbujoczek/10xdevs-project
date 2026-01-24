# API Endpoint Implementation Plan: Complete Flashcard Review

## 1. Endpoint Overview

**Purpose:** Finalizes the flashcard generation review process by persisting user-approved flashcards (both accepted and edited) to the database, updating generation event metrics, and returning statistics about the completed review.

**Functionality:**

- Saves flashcards that were accepted without modifications
- Saves flashcards that were edited by the user during review
- Calculates the number of rejected flashcards (candidates not submitted)
- Updates the `FlashcardGenerationEvent` with final counts
- Returns statistics including total saved count, breakdown by type, and IDs of created flashcards
- Ensures atomic transaction - all flashcards are saved or none

**Business Context:**
This endpoint is called after the user has reviewed AI-generated flashcard candidates from the `/api/flashcards/generate` endpoint. It represents the final step in the flashcard generation workflow where temporary candidates become permanent flashcards in the user's collection.

---

## 2. Request Details

### HTTP Method

**POST**

### URL Structure

```
/api/flashcards/generation/{eventId}/complete
```

### Path Parameters

| Parameter | Type    | Required | Description                                       |
| --------- | ------- | -------- | ------------------------------------------------- |
| `eventId` | integer | Yes      | Unique identifier of the FlashcardGenerationEvent |

### Headers

| Header          | Value                | Required | Description              |
| --------------- | -------------------- | -------- | ------------------------ |
| `Authorization` | `Bearer {jwt_token}` | Yes      | JWT authentication token |
| `Content-Type`  | `application/json`   | Yes      | Request body format      |

### Request Body Structure

**DTO:** `CompleteReviewRequestDto`

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
  ]
}
```

**Field Descriptions:**

- `accepted` (List<FlashcardCandidateDto>, required): Array of flashcards accepted without modifications. Can be empty but must be present.
- `edited` (List<FlashcardCandidateDto>, required): Array of flashcards that were modified by the user. Can be empty but must be present.
- Each `FlashcardCandidateDto` contains:
  - `candidateId` (string): Temporary identifier used during review (e.g., "temp-1")
  - `question` (string, max 200 chars): The flashcard question
  - `answer` (string, max 500 chars): The flashcard answer

**Validation Rules:**

- At least one of `accepted` or `edited` should contain flashcards (business logic validation)
- `question` must not exceed 200 characters (matches database constraint)
- `answer` must not exceed 500 characters (matches database constraint)
- `candidateId` should be unique within the combined accepted + edited arrays

---

## 3. Types Used

### DTOs

#### CompleteReviewRequestDto

**Location:** `10xdevs.Application/DTOs/Flashcards/CompleteReviewRequestDto.cs` (existing)

```csharp
public class CompleteReviewRequestDto
{
    [Required]
    public List<FlashcardCandidateDto> Accepted { get; set; } = [];

    [Required]
    public List<FlashcardCandidateDto> Edited { get; set; } = [];
}
```

#### FlashcardCandidateDto

**Location:** `10xdevs.Application/DTOs/Flashcards/FlashcardCandidateDto.cs` (existing)

```csharp
public class FlashcardCandidateDto
{
    public string CandidateId { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}
```

**Additional validation annotations needed:**

```csharp
public class FlashcardCandidateDto
{
    [Required]
    [MaxLength(50)]
    public string CandidateId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Question { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Answer { get; set; } = string.Empty;
}
```

#### CompleteReviewResponseDto

**Location:** `10xdevs.Application/DTOs/Flashcards/CompleteReviewResponseDto.cs` (existing)

```csharp
public class CompleteReviewResponseDto
{
    public int SavedFlashcardsCount { get; set; }
    public int AcceptedCount { get; set; }
    public int EditedCount { get; set; }
    public int RejectedCount { get; set; }
    public List<int> FlashcardIds { get; set; } = [];
}
```

### Command Model

#### CompleteReviewCommand

**Location:** `10xdevs.Application/Commands/Flashcards/CompleteReview/CompleteReviewCommand.cs` (to be created)

```csharp
using _10xdevs.Application.DTOs.Flashcards;
using MediatR;

namespace _10xdevs.Application.Commands.Flashcards.CompleteReview;

public record CompleteReviewCommand(
    int EventId,
    int UserId,
    CompleteReviewRequestDto Request
) : IRequest<CompleteReviewResponseDto>;
```

#### CompleteReviewCommandHandler

**Location:** `10xdevs.Application/Commands/Flashcards/CompleteReview/CompleteReviewCommandHandler.cs` (to be created)

```csharp
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Commands.Flashcards.CompleteReview;

public class CompleteReviewCommandHandler : IRequestHandler<CompleteReviewCommand, CompleteReviewResponseDto>
{
    private readonly IFlashcardGenerationEventRepository _eventRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CompleteReviewCommandHandler> _logger;

    public CompleteReviewCommandHandler(
        IFlashcardGenerationEventRepository eventRepository,
        IUnitOfWork unitOfWork,
        ILogger<CompleteReviewCommandHandler> logger)
    {
        _eventRepository = eventRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<CompleteReviewResponseDto> Handle(
        CompleteReviewCommand request,
        CancellationToken cancellationToken)
    {
        // Implementation details in section 8
    }
}
```

### Domain Entities

#### Flashcard

**Location:** `10xdevs.Domain/Entities/Flashcard.cs` (existing)

Used to create new flashcard records from accepted/edited candidates.

#### FlashcardGenerationEvent

**Location:** `10xdevs.Domain/Entities/FlashcardGenerationEvent.cs` (existing)

Updated with final counts after review completion.

### Repository Interfaces

#### IFlashcardGenerationEventRepository

**Location:** `10xdevs.Domain/Interfaces/IFlashcardGenerationEventRepository.cs` (existing)

Required methods:

- `GetByIdAsync(int id, CancellationToken)` - Retrieve event by ID
- `UpdateAsync(FlashcardGenerationEvent, CancellationToken)` - Update event with final counts

**Potential new method needed:**

```csharp
Task<FlashcardGenerationEvent?> GetByIdWithUserCheckAsync(
    int id,
    int userId,
    CancellationToken cancellationToken = default);
```

#### IFlashcardRepository

**Location:** `10xdevs.Domain/Interfaces/IFlashcardRepository.cs` (to be created)

```csharp
using _10xdevs.Domain.Entities;

namespace _10xdevs.Domain.Interfaces;

public interface IFlashcardRepository
{
    Task<Flashcard> CreateAsync(
        Flashcard flashcard,
        CancellationToken cancellationToken = default);

    Task<List<Flashcard>> CreateRangeAsync(
        List<Flashcard> flashcards,
        CancellationToken cancellationToken = default);
}
```

---

## 4. Response Details

### Success Response (200 OK)

**Status Code:** `200 OK`

**Response Body:**

```json
{
  "savedFlashcardsCount": 2,
  "acceptedCount": 1,
  "editedCount": 1,
  "rejectedCount": 2,
  "flashcardIds": [101, 102]
}
```

**Field Descriptions:**

- `savedFlashcardsCount` (integer): Total number of flashcards saved to database (accepted + edited)
- `acceptedCount` (integer): Number of flashcards accepted without modifications
- `editedCount` (integer): Number of flashcards accepted after user edits
- `rejectedCount` (integer): Number of candidates not submitted (calculated as: original CandidatesCount - accepted - edited)
- `flashcardIds` (array of integers): Database IDs of newly created flashcards in order (accepted first, then edited)

### Error Responses

#### 400 Bad Request - Validation Failed

**Trigger:** Question/answer length exceeded, invalid request format

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation error",
  "status": 400,
  "errors": {
    "accepted[0].question": ["Question must not exceed 200 characters"],
    "edited[1].answer": ["Answer must not exceed 500 characters"]
  }
}
```

#### 400 Bad Request - No Flashcards Submitted

**Trigger:** Both accepted and edited arrays are empty

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "At least one flashcard must be submitted (accepted or edited)."
}
```

#### 401 Unauthorized

**Trigger:** Missing, expired, or invalid JWT token

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication is required to access this resource."
}
```

#### 403 Forbidden

**Trigger:** Event belongs to a different user

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have permission to complete this generation event."
}
```

#### 404 Not Found

**Trigger:** Generation event with specified ID doesn't exist

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Generation event with ID 42 was not found."
}
```

#### 409 Conflict

**Trigger:** Review already completed for this event

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "The review for this generation event has already been completed."
}
```

#### 500 Internal Server Error

**Trigger:** Unexpected server errors, database failures

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred while processing your request."
}
```

---

## 5. Data Flow

### High-Level Flow Diagram

```
1. Client (Vue.js) → POST /api/flashcards/generation/{eventId}/complete
                      with JWT token + CompleteReviewRequestDto
                      ↓
2. FlashcardsController.CompleteReview()
   - Validates [Authorize] attribute (JWT authentication)
   - Extracts userId from JWT claims
   - Validates ModelState (ASP.NET validation attributes)
                      ↓
3. Send CompleteReviewCommand to MediatR
   - eventId, userId, CompleteReviewRequestDto
                      ↓
4. CompleteReviewCommandHandler.Handle()
   ├─→ 4.1: Retrieve FlashcardGenerationEvent by eventId
   │        ↓
   │   IFlashcardGenerationEventRepository.GetByIdAsync()
   │        ↓
   │   Validate: Event exists (404 if not)
   │        ↓
   ├─→ 4.2: Verify event ownership
   │        ↓
   │   Check: event.UserId == request.UserId (403 if not)
   │        ↓
   ├─→ 4.3: Check if review already completed
   │        ↓
   │   Validate: AcceptedCount == 0 && EditedCount == 0 (409 if completed)
   │        ↓
   ├─→ 4.4: Validate flashcard data
   │        ↓
   │   Check: At least one candidate submitted (400 if none)
   │   Check: Question ≤ 200 chars, Answer ≤ 500 chars (400 if exceeded)
   │        ↓
   ├─→ 4.5: Create Flashcard entities from accepted candidates
   │        ↓
   │   Map: FlashcardCandidateDto → Flashcard
   │   Set: Source = AI (0), Status = Accepted (1)
   │   Set: UserId, CreatedAtUtc, UpdatedAtUtc
   │        ↓
   ├─→ 4.6: Create Flashcard entities from edited candidates
   │        ↓
   │   Map: FlashcardCandidateDto → Flashcard
   │   Set: Source = AI (0), Status = Edited (2)
   │   Set: UserId, CreatedAtUtc, UpdatedAtUtc
   │        ↓
   ├─→ 4.7: Save flashcards to database
   │        ↓
   │   IFlashcardRepository.CreateRangeAsync(flashcards)
   │        ↓
   ├─→ 4.8: Calculate statistics
   │        ↓
   │   acceptedCount = accepted.Count
   │   editedCount = edited.Count
   │   rejectedCount = event.CandidatesCount - acceptedCount - editedCount
   │   savedCount = acceptedCount + editedCount
   │   flashcardIds = flashcards.Select(f => f.Id).ToList()
   │        ↓
   ├─→ 4.9: Update FlashcardGenerationEvent
   │        ↓
   │   Set: AcceptedCount, EditedCount, UpdatedAtUtc
   │   IFlashcardGenerationEventRepository.UpdateAsync(event)
   │        ↓
   └─→ 4.10: Commit transaction
            ↓
       IUnitOfWork.SaveChangesAsync()
            ↓
5. Return CompleteReviewResponseDto to Controller
            ↓
6. Controller → Client: 200 OK with response body
```

### Detailed Step-by-Step Flow

1. **Request Reception**

   - Client sends POST request with JWT token in Authorization header
   - ASP.NET Core pipeline validates JWT token automatically via `[Authorize]` attribute
   - Request body is deserialized into `CompleteReviewRequestDto`
   - Model validation runs based on DataAnnotations

2. **Controller Processing**

   - `FlashcardsController.CompleteReview(int eventId, CompleteReviewRequestDto request)` receives request
   - Extract `userId` from JWT claims using `User.GetUserId()` extension method
   - Create `CompleteReviewCommand` with eventId, userId, and request DTO
   - Send command to MediatR: `await _mediator.Send(command, cancellationToken)`

3. **Command Handler - Validation Phase**

   - Retrieve `FlashcardGenerationEvent` by `eventId` from repository
   - If not found → throw `NotFoundException` (caught by global exception handler → 404)
   - If `event.UserId != request.UserId` → throw `ForbiddenException` (→ 403)
   - If `event.AcceptedCount > 0 || event.EditedCount > 0` → throw `ConflictException` (→ 409)
   - If both `accepted` and `edited` arrays are empty → throw `BadRequestException` (→ 400)
   - Validate question/answer lengths (should be caught by model validation, but double-check)

4. **Command Handler - Flashcard Creation**

   - Create list to hold all new flashcard entities
   - Loop through `accepted` candidates:
     - Create `Flashcard` entity with:
       - `UserId = request.UserId`
       - `Question = candidate.Question`
       - `Answer = candidate.Answer`
       - `Source = FlashcardSource.AI` (enum value 0)
       - `Status = FlashcardStatus.Accepted` (enum value 1)
       - `CreatedAtUtc = DateTime.UtcNow`
       - `UpdatedAtUtc = DateTime.UtcNow`
       - SRS fields remain null (will be initialized on first review)
     - Add to flashcards list
   - Loop through `edited` candidates:
     - Create `Flashcard` entity with same fields as above except:
       - `Status = FlashcardStatus.Edited` (enum value 2)
     - Add to flashcards list

5. **Command Handler - Database Operations**

   - Call `IFlashcardRepository.CreateRangeAsync(flashcards)` to insert all flashcards
   - Repository adds flashcards to DbContext and returns list with generated IDs
   - Extract flashcard IDs: `flashcardIds = flashcards.Select(f => f.Id).ToList()`

6. **Command Handler - Update Event Statistics**

   - Update `FlashcardGenerationEvent`:
     - `event.AcceptedCount = accepted.Count`
     - `event.EditedCount = edited.Count`
     - `event.UpdatedAtUtc = DateTime.UtcNow`
   - Call `IFlashcardGenerationEventRepository.UpdateAsync(event)`

7. **Command Handler - Transaction Commit**

   - Call `await _unitOfWork.SaveChangesAsync(cancellationToken)` to commit transaction
   - If any database error occurs → throw exception (caught by global handler → 500)

8. **Command Handler - Response Building**

   - Create `CompleteReviewResponseDto`:
     - `SavedFlashcardsCount = flashcards.Count`
     - `AcceptedCount = accepted.Count`
     - `EditedCount = edited.Count`
     - `RejectedCount = event.CandidatesCount - accepted.Count - edited.Count`
     - `FlashcardIds = flashcardIds`
   - Return DTO to controller

9. **Controller Response**
   - Return `Ok(responseDto)` (HTTP 200) to client
   - ASP.NET Core serializes DTO to JSON automatically

### Transaction Boundary

**Critical:** All database operations must occur within a single transaction to ensure atomicity:

- Creating multiple flashcard records
- Updating the generation event

If any operation fails, all changes must be rolled back. This is handled by:

- Using `IUnitOfWork.SaveChangesAsync()` at the end
- EF Core's automatic transaction management for `SaveChanges()`
- Proper exception handling to prevent partial commits

---

## 6. Security Considerations

### Authentication

**Requirement:** Valid JWT Bearer token required for all requests

**Implementation:**

- Use `[Authorize]` attribute on controller or action
- JWT token validated automatically by ASP.NET Core authentication middleware
- Token should be configured in `Program.cs` with appropriate issuer, audience, and signing key
- Token expiration should be enforced (configured in JWT settings)

**Token Extraction:**

```csharp
// In controller
var userId = User.GetUserId(); // Extension method from ClaimsPrincipalExtensions
```

### Authorization

**Requirement:** Users can only complete review for their own generation events

**Implementation:**

1. Extract `userId` from authenticated JWT claims
2. Retrieve `FlashcardGenerationEvent` by `eventId`
3. Verify `event.UserId == userId`
4. If not matching → throw `ForbiddenException` (403 Forbidden)

**Security Note:** Never expose events from other users, even if the user knows the eventId. Always check ownership.

### Input Validation

#### Model Validation (Controller Level)

- Use `[Required]` attributes on DTO properties
- Use `[MaxLength]` attributes to enforce database constraints
- ASP.NET Core model validation runs automatically before action execution
- Check `ModelState.IsValid` in controller (or rely on automatic 400 response)

#### Business Validation (Handler Level)

- Ensure at least one flashcard is submitted (accepted or edited not both empty)
- Validate question length ≤ 200 characters (matches DB constraint: NVARCHAR(200))
- Validate answer length ≤ 500 characters (matches DB constraint: NVARCHAR(500))
- Validate event exists and belongs to authenticated user
- Validate event has not been completed already (AcceptedCount and EditedCount are 0)

#### Data Sanitization

- **XSS Protection:** ASP.NET Core automatically encodes JSON responses. Vue.js should use `v-text` or proper escaping when displaying user content.
- **SQL Injection:** EF Core uses parameterized queries automatically, protecting against SQL injection.
- **NoSQL Injection:** Not applicable (using SQL Server)
- **Content Validation:** Consider sanitizing or limiting special characters in questions/answers if needed for the application domain.

### Idempotency

**Issue:** This endpoint is NOT idempotent by design. Calling it twice with the same data would create duplicate flashcards (if not for the completion check).

**Protection Mechanism:**

- Check if review already completed: `event.AcceptedCount > 0 || event.EditedCount > 0`
- If true → return 409 Conflict
- This prevents accidental duplicate submissions

**Recommendation:** Frontend should disable the "Complete Review" button after successful submission to prevent duplicate requests.

## 7. Error Handling

### Exception Strategy

Use custom exception classes that are caught by `GlobalExceptionHandlerMiddleware` and converted to appropriate HTTP responses.

#### Custom Exceptions (to be created or used if existing)

**Location:** `10xdevs.Application/Exceptions/`

```csharp
// NotFoundException.cs
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

// ForbiddenException.cs
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}

// ConflictException.cs
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

// BadRequestException.cs
public class BadRequestException : Exception
{
    public BadRequestException(string message) : base(message) { }
}
```

### Error Scenarios and Handling

| Scenario                        | Exception               | HTTP Status | Response                                                           |
| ------------------------------- | ----------------------- | ----------- | ------------------------------------------------------------------ |
| JWT token missing/invalid       | Automatic by middleware | 401         | Unauthorized with standard ProblemDetails                          |
| Event not found                 | `NotFoundException`     | 404         | "Generation event with ID {id} was not found."                     |
| Event belongs to different user | `ForbiddenException`    | 403         | "You do not have permission to complete this generation event."    |
| Review already completed        | `ConflictException`     | 409         | "The review for this generation event has already been completed." |
| No flashcards submitted         | `BadRequestException`   | 400         | "At least one flashcard must be submitted (accepted or edited)."   |
| Question exceeds 200 chars      | Model validation        | 400         | "Question must not exceed 200 characters" in errors object         |
| Answer exceeds 500 chars        | Model validation        | 400         | "Answer must not exceed 500 characters" in errors object           |
| Database connection failure     | Unhandled exception     | 500         | "An unexpected error occurred while processing your request."      |
| Transaction failure             | Unhandled exception     | 500         | Same as above                                                      |

### Global Exception Handler

**Location:** `10xdevs.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` (existing)

**Expected Mapping:**

```csharp
catch (NotFoundException ex)
{
    await WriteJsonResponseAsync(context, StatusCodes.Status404NotFound,
        new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
            Title = "Not Found",
            Status = 404,
            Detail = ex.Message
        });
}

catch (ForbiddenException ex)
{
    await WriteJsonResponseAsync(context, StatusCodes.Status403Forbidden,
        new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.3",
            Title = "Forbidden",
            Status = 403,
            Detail = ex.Message
        });
}

catch (ConflictException ex)
{
    await WriteJsonResponseAsync(context, StatusCodes.Status409Conflict,
        new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
            Title = "Conflict",
            Status = 409,
            Detail = ex.Message
        });
}

catch (BadRequestException ex)
{
    await WriteJsonResponseAsync(context, StatusCodes.Status400BadRequest,
        new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = "Bad Request",
            Status = 400,
            Detail = ex.Message
        });
}

catch (Exception ex)
{
    _logger.LogError(ex, "Unhandled exception occurred");
    await WriteJsonResponseAsync(context, StatusCodes.Status500InternalServerError,
        new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Title = "Internal Server Error",
            Status = 500,
            Detail = "An unexpected error occurred while processing your request."
        });
}
```

### Logging Strategy

**Use structured logging with ILogger:**

```csharp
// Start of handler
_logger.LogInformation(
    "Starting flashcard review completion for EventId: {EventId}, UserId: {UserId}",
    request.EventId, request.UserId);

// Event not found
_logger.LogWarning(
    "Generation event not found. EventId: {EventId}, UserId: {UserId}",
    request.EventId, request.UserId);

// Forbidden access
_logger.LogWarning(
    "Forbidden access to generation event. EventId: {EventId}, RequestedBy: {UserId}, Owner: {OwnerId}",
    request.EventId, request.UserId, generationEvent.UserId);

// Review already completed
_logger.LogWarning(
    "Attempted to complete already finished review. EventId: {EventId}, UserId: {UserId}",
    request.EventId, request.UserId);

// Success
_logger.LogInformation(
    "Successfully completed flashcard review. EventId: {EventId}, UserId: {UserId}, SavedCount: {SavedCount}, AcceptedCount: {AcceptedCount}, EditedCount: {EditedCount}, RejectedCount: {RejectedCount}",
    request.EventId, request.UserId, savedCount, acceptedCount, editedCount, rejectedCount);

// Database error
_logger.LogError(ex,
    "Database error while completing flashcard review. EventId: {EventId}, UserId: {UserId}",
    request.EventId, request.UserId);
```

### Validation Error Response Format

**ASP.NET Core Model Validation Error Format:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "accepted[0].question": [
      "The field Question must be a string with a maximum length of 200."
    ],
    "edited[1].answer": [
      "The field Answer must be a string with a maximum length of 500."
    ]
  }
}
```

This is automatically generated by ASP.NET Core when model validation fails.

---

## 8. Performance Considerations

### Database Queries

**Number of Queries:**

1. **SELECT**: Retrieve `FlashcardGenerationEvent` by ID → 1 query
2. **INSERT**: Bulk insert flashcards → 1 query (using `AddRange`)
3. **UPDATE**: Update `FlashcardGenerationEvent` → 1 query
4. **COMMIT**: Transaction commit

**Total: ~3 database round trips**

### Optimization Strategies

#### 1. Bulk Insert Flashcards

- Use `IFlashcardRepository.CreateRangeAsync()` with EF Core's `AddRange()`
- This generates a single INSERT statement for multiple flashcards
- More efficient than individual INSERT statements in a loop

```csharp
// Good: Single query
var flashcards = new List<Flashcard>();
// ... populate flashcards
await _flashcardRepository.CreateRangeAsync(flashcards, cancellationToken);

// Bad: Multiple queries
foreach (var flashcard in flashcards)
{
    await _flashcardRepository.CreateAsync(flashcard, cancellationToken);
}
```

#### 2. Avoid N+1 Query Problems

- Not applicable here as we're only retrieving one entity (FlashcardGenerationEvent)
- No navigation properties need to be loaded eagerly

#### 3. Use Asynchronous Operations

- All database operations should use `async/await` for better thread pool utilization
- Prevents blocking threads during I/O operations
- All repository methods should accept `CancellationToken`

#### 4. Transaction Management

- Use EF Core's implicit transaction for `SaveChangesAsync()`
- All changes are committed or rolled back atomically
- No need for explicit `TransactionScope` unless coordinating with external resources

#### 5. Database Indexes

- Ensure index exists on `FlashcardGenerationEvents.Id` (primary key - automatic)
- Ensure index exists on `Flashcards.UserId` for future queries (specified in DB plan: `IX_Flashcards_UserId`)
- No additional indexes needed for this specific endpoint

## 9. Implementation Steps

### Phase 1: Foundation - DTOs and Exceptions (30 minutes)

#### Step 1.1: Update FlashcardCandidateDto with Validation

**File:** `10xdevs.Application/DTOs/Flashcards/FlashcardCandidateDto.cs`

- Add validation attributes:
  - `[Required]` on all properties
  - `[MaxLength(50)]` on `CandidateId`
  - `[MaxLength(200)]` on `Question`
  - `[MaxLength(500)]` on `Answer`

#### Step 1.2: Verify Existing Exception Classes

**Location:** `10xdevs.Application/Exceptions/`

Check if the following exceptions exist, create if missing:

- `NotFoundException.cs`
- `ForbiddenException.cs`
- `ConflictException.cs`
- `BadRequestException.cs`

Each should follow this pattern:

```csharp
namespace _10xdevs.Application.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }

    public NotFoundException(string message, Exception innerException)
        : base(message, innerException) { }
}
```

### Phase 2: Domain Layer - Repository Interface (20 minutes)

#### Step 2.1: Create IFlashcardRepository Interface

**File:** `10xdevs.Domain/Interfaces/IFlashcardRepository.cs`

```csharp
using _10xdevs.Domain.Entities;

namespace _10xdevs.Domain.Interfaces;

public interface IFlashcardRepository
{
    Task<Flashcard> CreateAsync(
        Flashcard flashcard,
        CancellationToken cancellationToken = default);

    Task<List<Flashcard>> CreateRangeAsync(
        List<Flashcard> flashcards,
        CancellationToken cancellationToken = default);
}
```

#### Step 2.2: Update IFlashcardGenerationEventRepository (if needed)

**File:** `10xdevs.Domain/Interfaces/IFlashcardGenerationEventRepository.cs`

Verify that the interface has:

- `GetByIdAsync(int id, CancellationToken)` method
- `UpdateAsync(FlashcardGenerationEvent, CancellationToken)` method

### Phase 3: Infrastructure Layer - Repository Implementation (45 minutes)

#### Step 3.1: Create FlashcardRepository

**File:** `10xdevs.Infrastructure/Repositories/FlashcardRepository.cs`

```csharp
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace _10xdevs.Infrastructure.Repositories;

public class FlashcardRepository : IFlashcardRepository
{
    private readonly ApplicationDbContext _context;

    public FlashcardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Flashcard> CreateAsync(
        Flashcard flashcard,
        CancellationToken cancellationToken = default)
    {
        await _context.Flashcards.AddAsync(flashcard, cancellationToken);
        return flashcard;
    }

    public async Task<List<Flashcard>> CreateRangeAsync(
        List<Flashcard> flashcards,
        CancellationToken cancellationToken = default)
    {
        await _context.Flashcards.AddRangeAsync(flashcards, cancellationToken);
        return flashcards;
    }
}
```

**Note:** These methods don't call `SaveChangesAsync()` - that's handled by `IUnitOfWork` to maintain transaction control.

#### Step 3.2: Register FlashcardRepository in DI Container

**File:** `10xdevs.Infrastructure/Extensions/ServiceCollectionExtensions.cs`

Add registration:

```csharp
services.AddScoped<IFlashcardRepository, FlashcardRepository>();
```

### Phase 4: Application Layer - Command and Handler (90 minutes)

**Validation Priority:** The command handler MUST validate the existence of `FlashcardGenerationEvent` before any other processing. This is the first and most critical check to prevent processing invalid event IDs.

#### Step 4.1: Create CompleteReviewCommand

**File:** `10xdevs.Application/Commands/Flashcards/CompleteReview/CompleteReviewCommand.cs`

```csharp
using _10xdevs.Application.DTOs.Flashcards;
using MediatR;

namespace _10xdevs.Application.Commands.Flashcards.CompleteReview;

public record CompleteReviewCommand(
    int EventId,
    int UserId,
    CompleteReviewRequestDto Request
) : IRequest<CompleteReviewResponseDto>;
```

#### Step 4.2: Create CompleteReviewCommandHandler

**File:** `10xdevs.Application/Commands/Flashcards/CompleteReview/CompleteReviewCommandHandler.cs`

**⚠️ CRITICAL VALIDATION:** The handler MUST check if `FlashcardGenerationEvent` exists as the first step. If `eventId` doesn't exist in the database, throw `NotFoundException` to return 404 status code. This prevents processing invalid event IDs.

```csharp
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Commands.Flashcards.CompleteReview;

public class CompleteReviewCommandHandler
    : IRequestHandler<CompleteReviewCommand, CompleteReviewResponseDto>
{
    private readonly IFlashcardGenerationEventRepository _eventRepository;
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CompleteReviewCommandHandler> _logger;

    public CompleteReviewCommandHandler(
        IFlashcardGenerationEventRepository eventRepository,
        IFlashcardRepository flashcardRepository,
        IUnitOfWork unitOfWork,
        ILogger<CompleteReviewCommandHandler> logger)
    {
        _eventRepository = eventRepository;
        _flashcardRepository = flashcardRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<CompleteReviewResponseDto> Handle(
        CompleteReviewCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Starting flashcard review completion for EventId: {EventId}, UserId: {UserId}",
            request.EventId, request.UserId);

        // 1. Retrieve generation event - CRITICAL: Check if event exists first!
        var generationEvent = await _eventRepository.GetByIdAsync(
            request.EventId,
            cancellationToken);

        if (generationEvent == null)
        {
            _logger.LogWarning(
                "Generation event not found. EventId: {EventId}, UserId: {UserId}",
                request.EventId, request.UserId);
            throw new NotFoundException(
                $"Generation event with ID {request.EventId} was not found.");
        }

        // 2. Verify ownership
        if (generationEvent.UserId != request.UserId)
        {
            _logger.LogWarning(
                "Forbidden access to generation event. EventId: {EventId}, RequestedBy: {UserId}, Owner: {OwnerId}",
                request.EventId, request.UserId, generationEvent.UserId);
            throw new ForbiddenException(
                "You do not have permission to complete this generation event.");
        }

        // 3. Check if review already completed
        if (generationEvent.AcceptedCount > 0 || generationEvent.EditedCount > 0)
        {
            _logger.LogWarning(
                "Attempted to complete already finished review. EventId: {EventId}, UserId: {UserId}",
                request.EventId, request.UserId);
            throw new ConflictException(
                "The review for this generation event has already been completed.");
        }

        // 4. Validate at least one flashcard is submitted
        var acceptedCount = request.Request.Accepted.Count;
        var editedCount = request.Request.Edited.Count;

        if (acceptedCount == 0 && editedCount == 0)
        {
            _logger.LogWarning(
                "No flashcards submitted for review completion. EventId: {EventId}, UserId: {UserId}",
                request.EventId, request.UserId);
            throw new BadRequestException(
                "At least one flashcard must be submitted (accepted or edited).");
        }

        // 5. Create flashcard entities from accepted candidates
        var flashcards = new List<Flashcard>();
        var now = DateTime.UtcNow;

        foreach (var candidate in request.Request.Accepted)
        {
            flashcards.Add(new Flashcard
            {
                UserId = request.UserId,
                Question = candidate.Question,
                Answer = candidate.Answer,
                Source = FlashcardSource.AI,
                Status = FlashcardStatus.Accepted,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            });
        }

        // 6. Create flashcard entities from edited candidates
        foreach (var candidate in request.Request.Edited)
        {
            flashcards.Add(new Flashcard
            {
                UserId = request.UserId,
                Question = candidate.Question,
                Answer = candidate.Answer,
                Source = FlashcardSource.AI,
                Status = FlashcardStatus.Edited,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            });
        }

        // 7. Save flashcards to database
        var savedFlashcards = await _flashcardRepository.CreateRangeAsync(
            flashcards,
            cancellationToken);

        // 8. Update generation event with final counts
        generationEvent.AcceptedCount = acceptedCount;
        generationEvent.EditedCount = editedCount;
        generationEvent.UpdatedAtUtc = now;

        await _eventRepository.UpdateAsync(generationEvent, cancellationToken);

        // 9. Commit transaction
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 10. Extract flashcard IDs (after SaveChanges, IDs are generated)
        var flashcardIds = savedFlashcards.Select(f => f.Id).ToList();

        // 11. Calculate rejected count
        var rejectedCount = generationEvent.CandidatesCount - acceptedCount - editedCount;
        var savedCount = acceptedCount + editedCount;

        _logger.LogInformation(
            "Successfully completed flashcard review. EventId: {EventId}, UserId: {UserId}, SavedCount: {SavedCount}, AcceptedCount: {AcceptedCount}, EditedCount: {EditedCount}, RejectedCount: {RejectedCount}",
            request.EventId, request.UserId, savedCount, acceptedCount, editedCount, rejectedCount);

        // 12. Build and return response
        return new CompleteReviewResponseDto
        {
            SavedFlashcardsCount = savedCount,
            AcceptedCount = acceptedCount,
            EditedCount = editedCount,
            RejectedCount = rejectedCount,
            FlashcardIds = flashcardIds
        };
    }
}
```

### Phase 5: API Layer - Controller Endpoint (30 minutes)

#### Step 5.1: Add CompleteReview Action to FlashcardsController

**File:** `10xdevs.Api/Controllers/FlashcardsController.cs`

```csharp
using _10xdevs.Application.Commands.Flashcards.CompleteReview;
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;

namespace _10xdevs.Api.Controllers;

[ApiController]
[Route("api/flashcards")]
[Authorize]
public class FlashcardsController : ControllerBase
{
    private readonly IMediator _mediator;

    public FlashcardsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ... other existing actions

    /// <summary>
    /// Completes the flashcard review process by saving accepted and edited flashcards
    /// </summary>
    /// <param name="eventId">Generation event identifier</param>
    /// <param name="request">Accepted and edited flashcards</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistics about saved flashcards</returns>
    /// <response code="200">Review completed successfully</response>
    /// <response code="400">Validation failed or no flashcards submitted</response>
    /// <response code="401">Missing or invalid authentication token</response>
    /// <response code="403">Event belongs to different user</response>
    /// <response code="404">Generation event not found</response>
    /// <response code="409">Review already completed</response>
    [HttpPost("generation/{eventId}/complete")]
    [ProducesResponseType(typeof(CompleteReviewResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CompleteReviewResponseDto>> CompleteReview(
        int eventId,
        [FromBody] CompleteReviewRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.GetUserId();

        var command = new CompleteReviewCommand(eventId, userId, request);
        var response = await _mediator.Send(command, cancellationToken);

        return Ok(response);
    }
}
```

### Phase 6: Exception Handling - Update Global Middleware (30 minutes)

#### Step 6.1: Update GlobalExceptionHandlerMiddleware

**File:** `10xdevs.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`

Ensure the middleware handles all custom exceptions:

- `NotFoundException` → 404
- `ForbiddenException` → 403
- `ConflictException` → 409
- `BadRequestException` → 400

Example pattern:

```csharp
catch (NotFoundException ex)
{
    context.Response.StatusCode = StatusCodes.Status404NotFound;
    var problemDetails = new ProblemDetails
    {
        Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
        Title = "Not Found",
        Status = StatusCodes.Status404NotFound,
        Detail = ex.Message
    };
    await context.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
}
```

### Phase 7: Database Configuration (20 minutes)

#### Step 7.1: Configure Flashcard Entity (if not already done)

**File:** `10xdevs.Infrastructure/Data/Configurations/FlashcardConfiguration.cs`

Ensure the entity is properly configured with:

- Primary key
- Foreign key to Users
- Column types and constraints (NVARCHAR(200), NVARCHAR(500))
- Default values
- Indexes

Example:

```csharp
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _10xdevs.Infrastructure.Data.Configurations;

public class FlashcardConfiguration : IEntityTypeConfiguration<Flashcard>
{
    public void Configure(EntityTypeBuilder<Flashcard> builder)
    {
        builder.ToTable("Flashcards");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Question)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(f => f.Answer)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(f => f.Source)
            .IsRequired()
            .HasDefaultValue(FlashcardSource.Manual);

        builder.Property(f => f.Status)
            .IsRequired()
            .HasDefaultValue(FlashcardStatus.NotApplicable);

        builder.Property(f => f.SRSEaseFactor)
            .HasColumnType("decimal(4,2)")
            .HasDefaultValue(2.5m);

        builder.Property(f => f.SRSRepetitions)
            .HasDefaultValue(0);

        builder.Property(f => f.CreatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(f => f.UpdatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Foreign key relationship
        builder.HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(f => f.UserId)
            .HasDatabaseName("IX_Flashcards_UserId");

        builder.HasIndex(f => f.SRSNextRepetitionDate)
            .HasDatabaseName("IX_Flashcards_SRSNextRepetitionDate");

        builder.HasIndex(f => new { f.UserId, f.Status })
            .HasDatabaseName("IX_Flashcards_UserId_Status");
    }
}
```

#### Step 7.2: Apply Entity Configuration in DbContext

**File:** `10xdevs.Infrastructure/Data/ApplicationDbContext.cs`

Ensure `FlashcardConfiguration` is applied:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.ApplyConfiguration(new FlashcardConfiguration());
    // ... other configurations
}
```

### Phase 8: Testing (60-90 minutes)

#### Step 8.3: Manual Testing with Swagger/Postman

- Set up test data (user, generation event with candidates)
- Test happy path: complete review successfully
- Test error scenarios with invalid data
- Verify database state after each test
- Test concurrent requests (if possible)

### Phase 9: Documentation and Swagger (20 minutes)

#### Step 9.1: Verify Swagger Documentation

- Ensure endpoint appears in Swagger UI
- Verify request/response schemas are correct
- Check that XML comments are displayed properly
- Test authentication with JWT token in Swagger UI

#### Step 9.2: Update API Documentation

- Update any internal API documentation
- Document example requests and responses
- Note any specific behavior or edge cases

**End of Implementation Plan**
