# API Endpoint Implementation Plan: Get Due Flashcards

## 1. Endpoint Overview

The **Get Due Flashcards** endpoint retrieves all flashcards that are due for review based on the Spaced Repetition System (SRS) algorithm. A flashcard is considered "due" when its `SRSNextRepetitionDate` is less than or equal to the current UTC time. This endpoint is essential for the learning session feature, allowing users to review flashcards at optimal intervals to maximize retention.

**Business Purpose:**

- Enable users to start a learning session with flashcards that require review
- Support the SRS algorithm by identifying flashcards scheduled for review
- Provide a count of due flashcards for UI display and progress tracking

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/learning/due`
- **Authentication:** Required (Bearer JWT token)
- **Content Type:** N/A (no request body)

### Parameters

**Path Parameters:**

- None

**Query Parameters:**

- None (future enhancement could include pagination or limit parameters)

**Headers:**

- `Authorization: Bearer {jwt_token}` (required)

**Request Body:**

- None

## 3. Response Details

### Success Response (200 OK)

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
    }
  ],
  "totalDueCount": 1
}
```

**Response Schema:**

- `flashcards` (array of objects, required): List of due flashcards
  - `id` (integer, required): Flashcard unique identifier
  - `question` (string, required): Question text (max 200 characters)
  - `answer` (string, required): Answer text (max 500 characters)
  - `srsRepetitions` (integer, required): Number of completed repetitions
  - `srsEaseFactor` (decimal, required): Current ease factor (2 decimal places)
  - `srsNextRepetitionDate` (string, required): ISO 8601 UTC datetime
- `totalDueCount` (integer, required): Total number of due flashcards

### Error Responses

**401 Unauthorized**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required"
}
```

**500 Internal Server Error**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred"
}
```

## 4. Types Used

### DTOs (Application Layer)

**DueFlashcardsResponseDto.cs** (already exists in `_10xdevs.Application.DTOs.Learning`)

```csharp
using _10xdevs.Application.DTOs.Flashcards;

namespace _10xdevs.Application.DTOs.Learning;

public class DueFlashcardsResponseDto
{
    public List<FlashcardDto> Flashcards { get; set; } = [];
    public int TotalDueCount { get; set; }
}
```

**FlashcardDto.cs** (already exists in `_10xdevs.Application.DTOs.Flashcards`, reused for this endpoint)

```csharp
using _10xdevs.Domain.Enums;

namespace _10xdevs.Application.DTOs.Flashcards;

public class FlashcardDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public FlashcardSource Source { get; set; }
    public FlashcardStatus Status { get; set; }
    public int? SRSInterval { get; set; }
    public int? SRSRepetitions { get; set; }
    public decimal? SRSEaseFactor { get; set; }
    public DateTime? SRSNextRepetitionDate { get; set; }
    public SRSGrade? SRSLastGrade { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
```

**Note:** The existing `FlashcardDto` includes more fields than required by the API specification. Only the relevant fields should be serialized in the response.

### Query (Application Layer - CQRS)

**GetDueFlashcardsQuery.cs**

```csharp
using _10xdevs.Application.DTOs.Learning;
using MediatR;

namespace _10xdevs.Application.Queries.Learning.GetDueFlashcards;

public sealed record GetDueFlashcardsQuery(int UserId) : IRequest<DueFlashcardsResponseDto>;
```

**GetDueFlashcardsQueryHandler.cs**

```csharp
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Domain.Interfaces;
using AutoMapper;
using MediatR;

namespace _10xdevs.Application.Queries.Learning.GetDueFlashcards;

public sealed class GetDueFlashcardsQueryHandler
    : IRequestHandler<GetDueFlashcardsQuery, DueFlashcardsResponseDto>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IMapper _mapper;

    public GetDueFlashcardsQueryHandler(
        IFlashcardRepository flashcardRepository,
        IMapper mapper)
    {
        _flashcardRepository = flashcardRepository;
        _mapper = mapper;
    }

    public async Task<DueFlashcardsResponseDto> Handle(
        GetDueFlashcardsQuery request,
        CancellationToken cancellationToken)
    {
        var dueFlashcards = await _flashcardRepository
            .GetDueFlashcardsAsync(request.UserId, cancellationToken);

        var flashcardDtos = _mapper.Map<List<FlashcardDto>>(dueFlashcards);

        return new DueFlashcardsResponseDto
        {
            Flashcards = flashcardDtos,
            TotalDueCount = flashcardDtos.Count
        };
    }
}
```

### Domain Entities

Use existing `Flashcard` entity from `10xdevs.Domain.Entities`.

### Repository Interface (Domain Layer)

**IFlashcardRepository.cs** (add new method)

```csharp
Task<IReadOnlyList<Flashcard>> GetDueFlashcardsAsync(int userId, CancellationToken cancellationToken);
```

### Repository Implementation (Infrastructure Layer)

**FlashcardRepository.cs** (add new method)

```csharp
public async Task<IReadOnlyList<Flashcard>> GetDueFlashcardsAsync(
    int userId,
    CancellationToken cancellationToken)
{
    var currentUtcTime = DateTime.UtcNow;

    return await _context.Flashcards
        .AsNoTracking()
        .Where(f =>
            f.UserId == userId &&
            f.Status != FlashcardStatus.Deleted &&
            (f.SRSNextRepetitionDate == null || f.SRSNextRepetitionDate <= currentUtcTime))
        .OrderBy(f => f.SRSNextRepetitionDate)
        .ToListAsync(cancellationToken);
}
```

### Controller (Api Layer)

**LearningController.cs**

```csharp
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Application.Queries.Learning.GetDueFlashcards;
using _10xdevs.Api.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _10xdevs.Api.Controllers;

[ApiController]
[Route("api/learning")]
[Authorize]
public class LearningController : ControllerBase
{
    private readonly IMediator _mediator;

    public LearningController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("due")]
    [ProducesResponseType(typeof(DueFlashcardsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDueFlashcards(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var query = new GetDueFlashcardsQuery(userId);
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }
}
```

## 5. Data Flow

### High-Level Flow

1. **Request Reception**

   - User sends GET request to `/api/learning/due` with JWT token in Authorization header
   - ASP.NET Core authentication middleware validates the JWT token
   - Request reaches `LearningController.GetDueFlashcards()`

2. **User Identity Extraction**

   - Extract `UserId` from JWT claims using `User.GetUserId()` extension method
   - No additional authorization check needed (user can only access their own flashcards)

3. **Query Creation and Dispatch**

   - Create `GetDueFlashcardsQuery` with extracted `UserId`
   - Send query to MediatR for handler resolution

4. **Query Handling**

   - `GetDueFlashcardsQueryHandler` receives the query
   - Calls `IFlashcardRepository.GetDueFlashcardsAsync()` with user ID

5. **Database Query Execution**

   - Repository queries `Flashcards` table with the following filters:
     - `UserId` matches authenticated user
     - `Status` is NOT `Deleted` (3)
     - `SRSNextRepetitionDate` is NULL (never reviewed) OR `SRSNextRepetitionDate` <= current UTC time
   - Results ordered by `SRSNextRepetitionDate` (earliest first, nulls first)
   - Query uses `AsNoTracking()` for read-only performance optimization
   - Leverages indexes: `IX_Flashcards_UserId_Status` and `IX_Flashcards_SRSNextRepetitionDate`

6. **Data Mapping**

   - AutoMapper transforms `Flashcard` entities to `FlashcardDto` objects
   - `FlashcardDto` includes all flashcard fields (id, question, answer, source, status, SRS parameters, timestamps)

7. **Response Construction**
   - Create `DueFlashcardsResponseDto` with:
     - Mapped flashcard DTOs (as `List<FlashcardDto>`)
     - Count of due flashcards
   - Return 200 OK with response DTO

### Database Interaction

**SQL Query (Conceptual):**

```sql
SELECT
    Id,
    Question,
    Answer,
    SRSRepetitions,
    SRSEaseFactor,
    SRSNextRepetitionDate
FROM Flashcards
WHERE
    UserId = @userId
    AND Status != 3  -- Not Deleted
    AND (SRSNextRepetitionDate IS NULL OR SRSNextRepetitionDate <= GETUTCDATE())
ORDER BY SRSNextRepetitionDate ASC
```

**Index Usage:**

- Primary filter by `UserId` and `Status` uses composite index `IX_Flashcards_UserId_Status`
- Date filter uses index `IX_Flashcards_SRSNextRepetitionDate`
- Query optimizer will choose the most efficient index based on statistics

## 6. Security Considerations

### Authentication

- **JWT Bearer Token Required:** All requests must include a valid JWT token in the Authorization header
- **Token Validation:** ASP.NET Core JWT middleware validates:
  - Token signature
  - Token expiration
  - Token issuer and audience
- **Unauthorized Response:** Return 401 if token is missing, expired, or invalid

### Authorization

- **User Data Isolation:** Users can only access their own flashcards
- **Implementation:** Filter by `UserId` extracted from authenticated user's JWT claims
- **No Role-Based Access:** All authenticated users have equal access to their own data

### Data Protection

- **No Sensitive Data Exposure:** Response includes only necessary flashcard data
- **PasswordHash Protection:** User passwords are never included in responses
- **SQL Injection Prevention:** Entity Framework parameterized queries prevent SQL injection
- **Mass Assignment Prevention:** Use immutable DTOs with init-only properties

### CORS (Cross-Origin Resource Sharing)

- **Configure CORS policy** in `Program.cs` to allow requests from frontend origin
- **Credentials Support:** Allow credentials for JWT token transmission

## 7. Error Handling

### Error Scenarios and Responses

| Scenario                    | HTTP Status               | Response                 | Handling                             |
| --------------------------- | ------------------------- | ------------------------ | ------------------------------------ |
| Missing JWT token           | 401 Unauthorized          | ProblemDetails           | Handled by authentication middleware |
| Invalid/expired JWT token   | 401 Unauthorized          | ProblemDetails           | Handled by authentication middleware |
| User has no due flashcards  | 200 OK                    | Empty array with count=0 | Not an error, return empty result    |
| Database connection failure | 500 Internal Server Error | ProblemDetails           | Caught by global exception handler   |
| Unexpected exception        | 500 Internal Server Error | ProblemDetails           | Caught by global exception handler   |

### Error Handling Strategy

1. **Authentication Errors (401)**

   - Handled automatically by ASP.NET Core authentication middleware
   - Return standardized ProblemDetails response
   - Log authentication failures for security monitoring

2. **Database Errors (500)**

   - Caught by global exception handling middleware
   - Log full exception details with correlation ID
   - Return generic error message to client (don't expose internal details)
   - Example logging: `_logger.LogError(ex, "Failed to retrieve due flashcards for user {UserId}", userId)`

3. **No Results Scenario**
   - NOT an error condition
   - Return 200 OK with empty `flashcards` array and `totalDueCount: 0`
   - Client handles empty state in UI

### Global Exception Handler

Ensure `GlobalExceptionHandlerMiddleware` is registered in `Program.cs` to catch and log all unhandled exceptions.

### Logging Strategy

- **Information Level:** Log successful query execution with user ID and result count
- **Warning Level:** Log when database query takes longer than expected (performance monitoring)
- **Error Level:** Log all exceptions with full stack trace and correlation ID
- **Structured Logging:** Include contextual data (userId, timestamp, request path)

## 9. Implementation Steps

### Phase 1: Domain Layer

1. **Add repository interface method** to `IFlashcardRepository` in `_10xdevs.Domain/Interfaces/IFlashcardRepository.cs`:
   ```csharp
   Task<IReadOnlyList<Flashcard>> GetDueFlashcardsAsync(int userId, CancellationToken cancellationToken);
   ```

### Phase 2: Infrastructure Layer

2. **Implement repository method** in `FlashcardRepository` in `_10xdevs.Infrastructure/Repositories/FlashcardRepository.cs`:

   - Add `GetDueFlashcardsAsync` method
   - Use `AsNoTracking()` for read-only query
   - Filter by `UserId`, `Status`, and `SRSNextRepetitionDate`
   - Order by `SRSNextRepetitionDate` ascending

3. **Verify database indexes** using SQL Server Management Studio:
   - Confirm `IX_Flashcards_UserId_Status` exists
   - Confirm `IX_Flashcards_SRSNextRepetitionDate` exists
   - Run query execution plan analysis

### Phase 3: Application Layer

4. **Verify existing DTOs**:

   - `DueFlashcardsResponseDto.cs` already exists in `_10xdevs.Application/DTOs/Learning/`
   - `FlashcardDto.cs` already exists in `_10xdevs.Application/DTOs/Flashcards/`
   - No new DTOs need to be created for this endpoint

5. **Create Query and Handler** in `_10xdevs.Application/Queries/Learning/GetDueFlashcards/`:

   - Create `GetDueFlashcardsQuery.cs` (implements `IRequest<DueFlashcardsResponseDto>`)
   - Create `GetDueFlashcardsQueryHandler.cs` (implements `IRequestHandler`)
   - Inject `IFlashcardRepository` and `IMapper`
   - Implement query handling logic

6. **Configure AutoMapper** in `_10xdevs.Application/Mappings/`:
   - Verify existing mapping profile for `Flashcard` → `FlashcardDto` (should already exist)
   - Ensure all SRS properties map correctly (nullable types)

### Phase 4: API Layer

7. **Create LearningController** in `_10xdevs.Api/Controllers/`:

   - Create `LearningController.cs` if it doesn't exist
   - Add `[ApiController]`, `[Route("api/learning")]`, and `[Authorize]` attributes
   - Inject `IMediator`

8. **Implement GetDueFlashcards endpoint:**

   - Add `[HttpGet("due")]` action method
   - Extract `UserId` using `User.GetUserId()`
   - Create and send `GetDueFlashcardsQuery`
   - Return `Ok(result)`

9. **Configure Swagger documentation:**
   - Add XML comments for API documentation
   - Add `[ProducesResponseType]` attributes for 200 and 401 responses

### Phase 5: Documentation and Deployment

13. **Update API documentation:**

    - Ensure Swagger UI displays endpoint correctly
    - Add example responses
    - Document authentication requirements

14. **Performance testing:**

    - Load test with 100+ concurrent requests
    - Verify response times meet requirements (< 100ms)
    - Monitor database query execution plans

15. **Code review checklist:**

    - DTOs are immutable (record types with init)
    - Repository method uses `AsNoTracking()`
    - User data isolation is enforced
    - Proper cancellation token support
    - Error handling is comprehensive
    - Logging is appropriate
    - No sensitive data in responses
    - Code follows project conventions

16. **Deploy to staging environment:**

    - Verify database indexes are created
    - Test with real user accounts
    - Verify JWT authentication works
    - Monitor application logs

17. **Deploy to production:**
    - Deploy during low-traffic period
    - Monitor error rates and performance metrics
    - Have rollback plan ready

## 10. Additional Notes

### Edge Cases

- **New user with no flashcards:** Returns empty array with count=0 (not an error)
- **User with only future-due flashcards:** Returns empty array with count=0
- **User with deleted flashcards:** Deleted flashcards are excluded from results
- **Flashcards without SRS data:** Flashcards with null `SRSNextRepetitionDate` are INCLUDED (they are due for first review)

### Dependencies

- Existing `Flashcard` entity (`_10xdevs.Domain.Entities`)
- Existing `FlashcardDto` (`_10xdevs.Application.DTOs.Flashcards`)
- Existing `DueFlashcardsResponseDto` (`_10xdevs.Application.DTOs.Learning`)
- Existing `IFlashcardRepository` interface (`_10xdevs.Domain.Interfaces`)
- Existing authentication middleware
- Existing `ClaimsPrincipalExtensions.GetUserId()` method
- AutoMapper configuration with `Flashcard` → `FlashcardDto` mapping
- MediatR pipeline

### Testing Data Setup

For testing, ensure test database has:

- Multiple users with distinct user IDs
- Flashcards with various `SRSNextRepetitionDate` values (past, present, future)
- Flashcards with different statuses (including deleted)
- Flashcards with and without SRS data
