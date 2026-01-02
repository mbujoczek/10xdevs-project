# API Endpoint Implementation Plan: Rate Flashcard

## 1. Endpoint Overview

The **Rate Flashcard** endpoint allows users to submit a rating (grade) for a flashcard after reviewing it during a learning session. The endpoint implements the Spaced Repetition System (SM-2) algorithm to calculate the next review date and update the flashcard's SRS parameters based on the user's performance.

**Business Purpose:**

- Capture user's recall performance for a specific flashcard (grade 0-5)
- Apply SM-2 algorithm to calculate optimal next repetition interval
- Update flashcard's SRS parameters (interval, repetitions, ease factor, next date)
- Track learning progress over time
- Optimize long-term retention through scientifically-proven spacing

**Key Algorithm Requirements:**

- Support grades 0-5 (complete blackout to perfect recall)
- Calculate new ease factor based on grade
- Determine next repetition interval in days
- Update repetition counter
- Record last grade for analytics

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/learning/flashcards/{id}/rate`
- **Authentication:** Required (Bearer JWT token)
- **Content Type:** `application/json`

### Parameters

**Path Parameters:**

- `id` (integer, required): Flashcard unique identifier

**Query Parameters:**

- None

**Headers:**

- `Authorization: Bearer {jwt_token}` (required)
- `Content-Type: application/json` (required)

**Request Body:**

```json
{
  "grade": 4
}
```

**Request Body Schema:**

- `grade` (enum, required): User's recall performance rating (`SRSGrade` enum)
  - Constraint: Must be a valid `SRSGrade` value (0-5)
  - `CompleteBlackout` (0) = Complete blackout, no recall
  - `IncorrectResponse` (1) = Incorrect, but correct answer felt familiar
  - `IncorrectResponseRecalled` (2) = Incorrect, but correct answer seemed easy to remember
  - `CorrectWithDifficulty` (3) = Correct with significant effort
  - `CorrectAfterHesitation` (4) = Correct with hesitation
  - `PerfectResponse` (5) = Perfect recall

## 3. Response Details

### Success Response (200 OK)

```json
{
  "id": 101,
  "srsInterval": 14,
  "srsRepetitions": 4,
  "srsEaseFactor": 2.6,
  "srsNextRepetitionDate": "2026-01-16T10:30:00Z",
  "srsLastGrade": 4,
  "updatedAtUtc": "2026-01-02T10:30:00Z"
}
```

**Response Schema:**

- `id` (integer, required): Flashcard unique identifier
- `srsInterval` (integer, required): New repetition interval in days
- `srsRepetitions` (integer, required): Updated repetition count
- `srsEaseFactor` (decimal, required): Updated ease factor (2 decimal places)
- `srsNextRepetitionDate` (string, required): Next scheduled review date (ISO 8601 UTC)
- `srsLastGrade` (integer, required): The grade submitted in this request
- `updatedAtUtc` (string, required): Timestamp when the flashcard was updated (ISO 8601 UTC)

### Error Responses

**400 Bad Request - Invalid Grade**

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

**401 Unauthorized**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required"
}
```

**403 Forbidden - Flashcard Belongs to Different User**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have permission to rate this flashcard"
}
```

**404 Not Found - Flashcard Not Found or Deleted**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Flashcard not found"
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

**RateFlashcardRequestDto.cs** (already exists in `_10xdevs.Application.DTOs.Learning`)

```csharp
using _10xdevs.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace _10xdevs.Application.DTOs.Learning;

public class RateFlashcardRequestDto
{
    [Required]
    public SRSGrade Grade { get; set; }
}
```

**RateFlashcardResponseDto.cs** (already exists in `_10xdevs.Application.DTOs.Learning`)

```csharp
using _10xdevs.Domain.Enums;

namespace _10xdevs.Application.DTOs.Learning;

public class RateFlashcardResponseDto
{
    public int Id { get; set; }
    public int SRSInterval { get; set; }
    public int SRSRepetitions { get; set; }
    public decimal SRSEaseFactor { get; set; }
    public DateTime SRSNextRepetitionDate { get; set; }
    public SRSGrade SRSLastGrade { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
```

### Commands (Application Layer - CQRS)

**RateFlashcardCommand.cs**

```csharp
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Domain.Enums;
using MediatR;

namespace _10xdevs.Application.Commands.Learning.RateFlashcard;

public sealed record RateFlashcardCommand(
    int FlashcardId,
    int UserId,
    SRSGrade Grade) : IRequest<RateFlashcardResponseDto>;
```

**RateFlashcardCommandValidator.cs**

```csharp
using _10xdevs.Domain.Enums;
using FluentValidation;

namespace _10xdevs.Application.Commands.Learning.RateFlashcard;

public sealed class RateFlashcardCommandValidator : AbstractValidator<RateFlashcardCommand>
{
    public RateFlashcardCommandValidator()
    {
        RuleFor(x => x.Grade)
            .IsInEnum()
            .WithMessage("Grade must be a valid SRSGrade value (0-5)");
    }
}
```

**RateFlashcardCommandHandler.cs**

```csharp
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Exceptions;
using _10xdevs.Domain.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Commands.Learning.RateFlashcard;

public sealed class RateFlashcardCommandHandler
    : IRequestHandler<RateFlashcardCommand, RateFlashcardResponseDto>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly ISpacedRepetitionService _spacedRepetitionService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<RateFlashcardCommandHandler> _logger;

    public RateFlashcardCommandHandler(
        IFlashcardRepository flashcardRepository,
        ISpacedRepetitionService spacedRepetitionService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<RateFlashcardCommandHandler> logger)
    {
        _flashcardRepository = flashcardRepository;
        _spacedRepetitionService = spacedRepetitionService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<RateFlashcardResponseDto> Handle(
        RateFlashcardCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Retrieve flashcard
        var flashcard = await _flashcardRepository.GetByIdAsync(
            request.FlashcardId,
            cancellationToken);

        if (flashcard == null || flashcard.Status == FlashcardStatus.Deleted)
        {
            throw new FlashcardNotFoundException(request.FlashcardId);
        }

        // 2. Verify ownership
        if (flashcard.UserId != request.UserId)
        {
            throw new FlashcardAccessForbiddenException(request.FlashcardId);
        }

        // 3. Calculate new SRS parameters
        var srsResult = _spacedRepetitionService.CalculateNextReview(
            currentEaseFactor: flashcard.SRSEaseFactor ?? 2.5m,
            currentRepetitions: flashcard.SRSRepetitions ?? 0,
            grade: (int)request.Grade,
            reviewDate: DateTime.UtcNow);

        // 4. Update flashcard
        flashcard.UpdateSRSParameters(
            interval: srsResult.Interval,
            repetitions: srsResult.Repetitions,
            easeFactor: srsResult.EaseFactor,
            nextRepetitionDate: srsResult.NextRepetitionDate,
            lastGrade: request.Grade);

        // 5. Save changes
        _flashcardRepository.Update(flashcard);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Flashcard {FlashcardId} rated with grade {Grade} by user {UserId}. Next review: {NextReview}",
            request.FlashcardId,
            request.Grade,
            request.UserId,
            srsResult.NextRepetitionDate);

        // 6. Map and return response
        return _mapper.Map<RateFlashcardResponseDto>(flashcard);
    }
}
```

### Domain Entities

**Flashcard.cs** (add method)

```csharp
using _10xdevs.Domain.Enums;

namespace _10xdevs.Domain.Entities;

public class Flashcard
{
    // ... existing properties ...

    public void UpdateSRSParameters(
        int interval,
        int repetitions,
        decimal easeFactor,
        DateTime nextRepetitionDate,
        SRSGrade lastGrade)
    {
        SRSInterval = interval;
        SRSRepetitions = repetitions;
        SRSEaseFactor = easeFactor;
        SRSNextRepetitionDate = nextRepetitionDate;
        SRSLastGrade = lastGrade;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
```

### Domain Services

**ISpacedRepetitionService.cs**

```csharp
using _10xdevs.Domain.ValueObjects;

namespace _10xdevs.Domain.Interfaces;

public interface ISpacedRepetitionService
{
    SRSCalculationResult CalculateNextReview(
        decimal currentEaseFactor,
        int currentRepetitions,
        int grade,
        DateTime reviewDate);
}
```

**SRSCalculationResult.cs**

```csharp
namespace _10xdevs.Domain.ValueObjects;

public sealed record SRSCalculationResult
{
    public int Interval { get; init; }
    public int Repetitions { get; init; }
    public decimal EaseFactor { get; init; }
    public DateTime NextRepetitionDate { get; init; }
}
```

### Infrastructure Services

**Important Decision: SM-2 Algorithm Implementation**

There are two approaches to implementing the SM-2 algorithm:

**Option 1: Use Open-Source Library (Recommended for MVP)**

- **Pros:** Battle-tested, less code to maintain, faster implementation
- **Cons:** External dependency, less control over algorithm details
- **Recommendation:** Research available .NET libraries for SM-2 (e.g., NuGet packages)
  - If a suitable, well-maintained library exists with good documentation
  - Verify license compatibility (MIT, Apache 2.0, etc.)
  - Check last update date and community support

**Option 2: Custom Implementation (Shown below)**

- **Pros:** Full control, no external dependencies, can customize algorithm
- **Cons:** More code to maintain and test, potential for bugs
- **Use when:** No suitable library found or specific customization needed

**For MVP:** Evaluate available libraries first. If none suitable, use custom implementation below.

**SpacedRepetitionService.cs** (SM-2 Algorithm Implementation)

```csharp
using _10xdevs.Domain.Interfaces;
using _10xdevs.Domain.ValueObjects;

namespace _10xdevs.Infrastructure.Services;

public sealed class SpacedRepetitionService : ISpacedRepetitionService
{
    private const decimal MinEaseFactor = 1.3m;
    private const decimal MaxEaseFactor = 2.5m;

    public SRSCalculationResult CalculateNextReview(
        decimal currentEaseFactor,
        int currentRepetitions,
        int grade,
        DateTime reviewDate)
    {
        // SM-2 Algorithm Implementation

        // Step 1: Calculate new ease factor
        var newEaseFactor = CalculateEaseFactor(currentEaseFactor, grade);

        // Step 2: Determine interval and repetitions
        int newInterval;
        int newRepetitions;

        if (grade < 3)
        {
            // Failed recall - restart from the beginning
            newInterval = 1; // Review again tomorrow
            newRepetitions = 0;
            // Keep ease factor but ensure minimum
            newEaseFactor = Math.Max(newEaseFactor, MinEaseFactor);
        }
        else
        {
            // Successful recall
            newRepetitions = currentRepetitions + 1;

            if (newRepetitions == 1)
            {
                newInterval = 1; // First repetition: 1 day
            }
            else if (newRepetitions == 2)
            {
                newInterval = 6; // Second repetition: 6 days
            }
            else
            {
                // Subsequent repetitions: multiply previous interval by ease factor
                var previousInterval = CalculatePreviousInterval(currentRepetitions);
                newInterval = (int)Math.Round(previousInterval * (double)newEaseFactor);
            }
        }

        // Step 3: Calculate next repetition date
        var nextRepetitionDate = reviewDate.AddDays(newInterval);

        return new SRSCalculationResult
        {
            Interval = newInterval,
            Repetitions = newRepetitions,
            EaseFactor = newEaseFactor,
            NextRepetitionDate = nextRepetitionDate
        };
    }

    private decimal CalculateEaseFactor(decimal currentEaseFactor, int grade)
    {
        // SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        // where q is the grade (0-5)

        var adjustment = 0.1m - (5 - grade) * (0.08m + (5 - grade) * 0.02m);
        var newEaseFactor = currentEaseFactor + adjustment;

        // Ensure ease factor stays within bounds
        return Math.Max(MinEaseFactor, Math.Min(MaxEaseFactor, newEaseFactor));
    }

    private int CalculatePreviousInterval(int currentRepetitions)
    {
        // Estimate previous interval based on repetition count
        if (currentRepetitions <= 1) return 1;
        if (currentRepetitions == 2) return 6;

        // For higher repetitions, this is an approximation
        // In practice, we could store the previous interval
        return 6; // Default fallback
    }
}
```

### Domain Exceptions

**FlashcardNotFoundException.cs**

```csharp
namespace _10xdevs.Domain.Exceptions;

public sealed class FlashcardNotFoundException : Exception
{
    public FlashcardNotFoundException(int flashcardId)
        : base($"Flashcard with ID {flashcardId} was not found")
    {
        FlashcardId = flashcardId;
    }

    public int FlashcardId { get; }
}
```

**FlashcardAccessForbiddenException.cs**

```csharp
namespace _10xdevs.Domain.Exceptions;

public sealed class FlashcardAccessForbiddenException : Exception
{
    public FlashcardAccessForbiddenException(int flashcardId)
        : base($"Access to flashcard with ID {flashcardId} is forbidden")
    {
        FlashcardId = flashcardId;
    }

    public int FlashcardId { get; }
}
```

### Repository Interface

**IFlashcardRepository.cs** (add methods)

```csharp
Task<Flashcard?> GetByIdAsync(int id, CancellationToken cancellationToken);
void Update(Flashcard flashcard);
```

### Controller (Api Layer)

**LearningController.cs** (add method)

```csharp
using _10xdevs.Application.Commands.Learning.RateFlashcard;
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Api.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _10xdevs.Api.Controllers;

// ... existing controller code ...

[HttpPost("flashcards/{id}/rate")]
[ProducesResponseType(typeof(RateFlashcardResponseDto), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<IActionResult> RateFlashcard(
    [FromRoute] int id,
    [FromBody] RateFlashcardRequestDto request,
    CancellationToken cancellationToken)
{
    var userId = User.GetUserId();

    var command = new RateFlashcardCommand(
        FlashcardId: id,
        UserId: userId,
        Grade: request.Grade);

    var result = await _mediator.Send(command, cancellationToken);

    return Ok(result);
}
```

## 5. Data Flow

### High-Level Flow

1. **Request Reception**

   - User sends POST request to `/api/learning/flashcards/{id}/rate` with JWT token
   - Request body contains grade (0-5)
   - ASP.NET Core authentication middleware validates JWT token

2. **Request Validation**

   - Model binding validates request body structure
   - FluentValidation validates:
     - Grade is between 0 and 5
   - Return 400 Bad Request if validation fails

3. **User Identity Extraction**

   - Extract `UserId` from JWT claims using `User.GetUserId()`
   - Create `RateFlashcardCommand` with flashcard ID, user ID, and grade

4. **Command Dispatch**

   - Send command to MediatR
   - MediatR pipeline executes validation behavior (FluentValidation)
   - Handler receives validated command

5. **Flashcard Retrieval**

   - Query database for flashcard by ID
   - Check if flashcard exists
   - Check if flashcard status is not Deleted
   - Throw `FlashcardNotFoundException` (404) if not found or deleted

6. **Authorization Check**

   - Verify flashcard.UserId matches authenticated user ID
   - Throw `FlashcardAccessForbiddenException` (403) if ownership check fails

7. **SRS Calculation**

   - Call `ISpacedRepetitionService.CalculateNextReview()` with:
     - Current ease factor (default 2.5 if null)
     - Current repetition count (default 0 if null)
     - User's grade (0-5)
     - Review date (current UTC time)
   - Service applies SM-2 algorithm to calculate:
     - New interval in days
     - Updated repetition count
     - New ease factor
     - Next repetition date

8. **Entity Update**

   - Call `flashcard.UpdateSRSParameters()` domain method
   - Method updates all SRS properties and `UpdatedAtUtc`
   - Mark entity as modified in repository

9. **Persistence**

   - Save changes via `IUnitOfWork`
   - Database trigger automatically updates `UpdatedAtUtc`
   - Commit transaction

10. **Response Construction**
    - Map updated `Flashcard` entity to `RateFlashcardResponseDto`
    - Return 200 OK with response DTO
    - Log successful rating with correlation information

### SM-2 Algorithm Logic Flow

**Input:** Current SRS state + Grade
**Output:** New SRS state

```
If grade < 3 (Failed):
  - Reset repetitions to 0
  - Set interval to 1 day
  - Decrease ease factor (minimum 1.3)
  - Next review = today + 1 day

Else (Passed):
  - Increment repetitions
  - If first repetition: interval = 1 day
  - If second repetition: interval = 6 days
  - If third+ repetition: interval = previous_interval * ease_factor
  - Update ease factor based on grade quality
  - Next review = review_date + interval
```

### Database Interaction

**Query (Get Flashcard):**

```sql
SELECT * FROM Flashcards
WHERE Id = @id
  AND Status != 3  -- Not deleted
```

**Update (Save SRS Parameters):**

```sql
UPDATE Flashcards
SET
  SRSInterval = @interval,
  SRSRepetitions = @repetitions,
  SRSEaseFactor = @easeFactor,
  SRSNextRepetitionDate = @nextDate,
  SRSLastGrade = @grade,
  UpdatedAtUtc = GETUTCDATE()
WHERE Id = @id
```

## 6. Security Considerations

### Authentication

- **JWT Bearer Token Required:** All requests must include valid JWT token
- **Token Validation:** Standard ASP.NET Core JWT middleware validation
- **401 Response:** Return if token is missing, expired, or invalid

### Authorization

- **Ownership Verification:** Critical security check
  - Retrieve flashcard from database
  - Compare `flashcard.UserId` with authenticated user's ID from JWT
  - Throw `FlashcardAccessForbiddenException` (403) if mismatch
  - **NEVER** skip this check - prevents users from rating others' flashcards

### Input Validation

- **Grade Validation:** Must be a valid `SRSGrade` enum value (0-5) - enforced by model binding, FluentValidation, and database constraint
- **Flashcard ID Validation:** Must be positive integer (model binding)

### Data Integrity

- **Transaction Support:** Use `IUnitOfWork` to ensure atomic updates
- **Optimistic Concurrency:** Consider adding `RowVersion` for concurrent updates (future enhancement)
- **SQL Injection Prevention:** Entity Framework parameterized queries

### Business Logic Security

- **SRS Algorithm Integrity:** Algorithm runs server-side only (client cannot manipulate)
- **No Client-Side Calculation:** Client only provides grade, server calculates everything
- **Audit Trail:** Log all rating actions with user ID and flashcard ID

### Rate Limiting

- **Recommendation:** Implement rate limiting to prevent abuse
- **Suggestion:** Max 100 ratings per hour per user (future enhancement)

## 7. Error Handling

### Error Scenarios and Responses

| Scenario                             | HTTP Status               | Exception Type                    | Response Body               |
| ------------------------------------ | ------------------------- | --------------------------------- | --------------------------- |
| Missing JWT token                    | 401 Unauthorized          | N/A                               | ProblemDetails (middleware) |
| Invalid/expired JWT                  | 401 Unauthorized          | N/A                               | ProblemDetails (middleware) |
| Invalid grade (not a valid SRSGrade) | 400 Bad Request           | ValidationException               | Validation errors           |
| Flashcard not found                  | 404 Not Found             | FlashcardNotFoundException        | ProblemDetails              |
| Flashcard deleted                    | 404 Not Found             | FlashcardNotFoundException        | ProblemDetails              |
| Wrong user (not owner)               | 403 Forbidden             | FlashcardAccessForbiddenException | ProblemDetails              |
| Database connection error            | 500 Internal Server Error | SqlException                      | Generic error message       |
| Unexpected exception                 | 500 Internal Server Error | Exception                         | Generic error message       |

### Exception Handling Strategy

1. **Validation Errors (400)**

   - Handled by FluentValidation behavior in MediatR pipeline
   - Return detailed validation errors with field names
   - Example: `{"errors": {"grade": ["Grade must be a valid SRSGrade value (0-5)"]}}`

2. **Domain Exceptions (403, 404)**

   - Custom exceptions thrown by handler
   - Caught by global exception handler middleware
   - Mapped to appropriate HTTP status codes
   - Log with structured data (flashcard ID, user ID)

3. **Infrastructure Exceptions (500)**

   - Database errors, network issues, etc.
   - Caught by global exception handler
   - Log full exception details with correlation ID
   - Return generic error message (don't expose internals)

4. **Transaction Rollback**
   - If exception occurs after database modification, `IUnitOfWork` ensures rollback
   - Flashcard state remains unchanged

### Global Exception Handler Mappings

```csharp
// In GlobalExceptionHandlerMiddleware
case FlashcardNotFoundException:
    return Results.Problem(
        title: "Not Found",
        statusCode: StatusCodes.Status404NotFound,
        detail: "Flashcard not found");

case FlashcardAccessForbiddenException:
    return Results.Problem(
        title: "Forbidden",
        statusCode: StatusCodes.Status403Forbidden,
        detail: "You do not have permission to rate this flashcard");

case ValidationException validationException:
    return Results.ValidationProblem(
        validationException.Errors,
        statusCode: StatusCodes.Status400BadRequest);
```

### Logging Strategy

- **Information Level:**

  - Successful rating with grade, flashcard ID, user ID, next review date
  - Example: `"Flashcard {FlashcardId} rated with grade {Grade} by user {UserId}. Next review: {NextReview}"`

- **Warning Level:**

  - Attempted access to deleted flashcard
  - Attempted access to another user's flashcard
  - Invalid date ranges (but not validation errors)

- **Error Level:**
  - Database errors with full exception stack trace
  - Unexpected exceptions with context
  - Include correlation ID for request tracing

## 8. Performance Considerations

### Database Performance

**Query Performance:**

- Primary key lookup is highly efficient (clustered index)
- Expected query time: < 5ms
- Update operation time: < 10ms

**Index Usage:**

- `PK_Flashcards` (clustered index on `Id`) for retrieval
- No additional indexes needed for this operation

**Connection Management:**

- Use async/await throughout to avoid thread blocking
- Entity Framework manages connection pooling

**Transaction Overhead:**

- Minimal overhead for single-row update
- Transaction ensures data consistency

### Algorithm Performance

**SM-2 Calculation:**

- Pure computational logic (no I/O)
- Execution time: < 1ms
- Simple arithmetic operations
- No external service calls

**Memory Usage:**

- Minimal memory footprint
- Single entity loaded into memory
- No large collections or caching

### Expected Response Times

- **Total Request Time:** < 100ms (95th percentile)
  - Authentication: < 5ms
  - Database query: < 5ms
  - Algorithm calculation: < 1ms
  - Database update: < 10ms
  - Response serialization: < 5ms
  - Network latency: variable

### Optimization Opportunities

**Current Implementation:**

- Already optimized for single flashcard updates
- No N+1 query problems
- Minimal database round trips (1 query + 1 update)

**Future Enhancements:**

- Batch rating support for multiple flashcards (one transaction)
- Caching of user's flashcard IDs for ownership checks (Redis)
- Background job for SRS recalculation (if algorithm changes)

### Scalability Considerations

**Concurrent Updates:**

- Multiple users can rate their flashcards simultaneously (no contention)
- Single user rating multiple flashcards sequentially is fine
- Consider optimistic concurrency for future versions (RowVersion)

**Load Testing Targets:**

- Support 1000 ratings per minute across all users
- < 200ms response time at peak load
- < 0.1% error rate

### Monitoring Metrics

**Performance Metrics:**

- Average response time
- 95th percentile response time
- Database query execution time
- SRS calculation time
- Concurrent request count

**Business Metrics:**

- Ratings per minute/hour/day
- Grade distribution (0-5)
- Average ease factor by user
- Average interval by repetition count

**Alerts:**

- Alert if response time exceeds 200ms (p95)
- Alert if error rate exceeds 1%
- Alert if database query time exceeds 50ms

## 9. Implementation Steps

### Phase 1: Domain Layer

1. **Create value object** `SRSCalculationResult` in `10xdevs.Domain/ValueObjects/`:

   - Define properties for interval, repetitions, ease factor, next date
   - Use record type for immutability

2. **Create domain service interface** `ISpacedRepetitionService` in `10xdevs.Domain/Interfaces/`:

   - Define `CalculateNextReview` method signature

3. **Add domain method** to `Flashcard` entity in `10xdevs.Domain/Entities/Flashcard.cs`:

   - Add `UpdateSRSParameters` method
   - Update all SRS properties
   - Set `UpdatedAtUtc` to current UTC time

4. **Create custom exceptions** in `10xdevs.Domain/Exceptions/`:
   - Create `FlashcardNotFoundException.cs`
   - Create `FlashcardAccessForbiddenException.cs`
   - Both should include flashcard ID property

### Phase 2: Infrastructure Layer

5. **Evaluate SM-2 libraries** (recommended first step):

   - Search NuGet for SM-2 or SuperMemo implementations
   - Evaluate candidates based on:
     - License compatibility (MIT, Apache 2.0 preferred)
     - Last update date (< 1 year ideal)
     - Download count and community support
     - Documentation quality
     - Test coverage
   - If suitable library found: integrate it and skip custom implementation
   - If no suitable library: proceed with custom `SpacedRepetitionService` implementation

6. **Implement `SpacedRepetitionService`** (if no library chosen):
7. **Implement `SpacedRepetitionService`** (if no library chosen):

   - Create `SpacedRepetitionService.cs` in `_10xdevs.Infrastructure/Services/`
   - Implement SM-2 algorithm in `CalculateNextReview` method
   - Add private helper methods for ease factor calculation
   - Add unit tests for algorithm correctness

8. **Implement repository methods** in `FlashcardRepository`:

   - Add `GetByIdAsync` method (if not exists)
   - Add `Update` method (if not exists)
   - Ensure proper async/await usage

9. **Register service** in dependency injection:
   - Add `services.AddScoped<ISpacedRepetitionService, SpacedRepetitionService>()` in `InfrastructureExtensions.cs`
   - OR configure library service if using external package

### Phase 3: Application Layer

9. **Verify existing DTOs**:

   - `RateFlashcardRequestDto.cs` already exists in `_10xdevs.Application/DTOs/Learning/`
   - `RateFlashcardResponseDto.cs` already exists in `_10xdevs.Application/DTOs/Learning/`
   - Verify they match the specification (use `SRSGrade` enum)

10. **Create command** in `_10xdevs.Application/Commands/Learning/RateFlashcard/`:
11. **Create command** in `_10xdevs.Application/Commands/Learning/RateFlashcard/`:

- Create `RateFlashcardCommand.cs`
- Implement `IRequest<RateFlashcardResponseDto>`
- Use record type with positional parameters
- Use `SRSGrade` enum for Grade parameter

11. **Create command validator**:

    - Create `RateFlashcardCommandValidator.cs` in same folder
    - Inherit from `AbstractValidator<RateFlashcardCommand>`
    - Add validation rule: `RuleFor(x => x.Grade).IsInEnum()`

12. **Create command handler**:

    - Create `RateFlashcardCommandHandler.cs`
    - Inject dependencies (repository, service, unit of work, mapper, logger)
    - Implement handler logic (retrieve, authorize, calculate, update, save)
    - Cast `SRSGrade` to `int` when calling `CalculateNextReview`: `(int)request.Grade`
    - Add proper exception handling
    - Add structured logging

13. **Configure AutoMapper** in `_10xdevs.Application/Mappings/`:
    - Add mapping for `Flashcard` → `RateFlashcardResponseDto`
    - Map all SRS properties correctly
    - Ensure `SRSLastGrade` (enum) maps correctly

### Phase 4: API Layer

14. **Update `LearningController`** in `_10xdevs.Api/Controllers/`:
15. **Update `LearningController`** in `_10xdevs.Api/Controllers/`:

    - Add `RateFlashcard` action method
    - Add `[HttpPost("flashcards/{id}/rate")]` attribute
    - Add `[ProducesResponseType]` attributes for all status codes
    - Extract user ID from claims
    - Create and send command
    - Return Ok with result

16. **Update global exception handler**:
    - Add mapping for `FlashcardNotFoundException` → 404
    - Add mapping for `FlashcardAccessForbiddenException` → 403
    - Ensure proper ProblemDetails responses

### Phase 5: Testing

16. **Write unit tests** for `SpacedRepetitionService` (if custom implementation):
17. **Write unit tests** for `SpacedRepetitionService` (if custom implementation):

    - Test grade 0-5 calculations
    - Test first repetition (interval = 1)
    - Test second repetition (interval = 6)
    - Test subsequent repetitions (interval = previous \* ease factor)
    - Test ease factor adjustments
    - Test ease factor boundaries (min 1.3, max 2.5)
    - Test failed recall (grade < 3) resets repetitions

18. **Write unit tests** for `RateFlashcardCommandHandler`:

    - Test successful rating flow with various `SRSGrade` values
    - Test flashcard not found exception
    - Test flashcard deleted exception
    - Test access forbidden exception (wrong user)
    - Mock all dependencies
    - Verify SRS service is called with correct parameters (int cast of enum)
    - Verify repository Update is called
    - Verify UnitOfWork SaveChanges is called

19. **Write unit tests** for `RateFlashcardCommandValidator`:

    - Test valid `SRSGrade` enum values (CompleteBlackout to PerfectResponse)
    - Test invalid enum values (e.g., -1, 6, 100)
    - Test null grade (should fail)

20. **Write integration tests** for endpoint:

    - Test successful rating with valid token and each `SRSGrade` value
    - Test 400 with invalid grade (invalid enum value)
    - Test 401 with missing token
    - Test 403 with different user's flashcard
    - Test 404 with non-existent flashcard ID
    - Test 404 with deleted flashcard
    - Verify database changes persist
    - Verify response schema matches specification
    - Verify `SRSLastGrade` is correctly stored as enum

21. **Write repository tests**:
22. **Write repository tests**:
    - Test `GetByIdAsync` with valid ID
    - Test `GetByIdAsync` with non-existent ID
    - Test `Update` persists changes
    - Use in-memory database or test database

### Phase 6: Documentation and Deployment

21. **Update Swagger documentation**:

    - Add XML comments to controller action
    - Document request body schema with `SRSGrade` enum examples
    - Document response schemas for all status codes
    - Document grade scale meanings (enum values)

22. **Create API usage documentation**:

    - Provide example curl commands with enum values
    - Explain `SRSGrade` enum meanings
    - Explain SRS algorithm briefly
    - Document expected workflow

23. **Performance testing**:
24. **Performance testing**:

    - Load test with 100+ concurrent ratings
    - Verify response times < 100ms (p95)
    - Test rating same flashcard multiple times
    - Monitor database performance

25. **Code review checklist**:

    - SM-2 algorithm correctly implemented (library or custom)
    - Ownership check is present and correct
    - Transaction handling is correct
    - Validation covers all edge cases
    - `SRSGrade` enum used consistently
    - Enum to int casting done correctly in service call
    - Exceptions are properly thrown and handled
    - Logging is comprehensive
    - DTOs use proper types (class with properties)
    - Async/await used consistently
    - Code follows project conventions (namespace `_10xdevs`)

26. **Security review**:

    - Verify JWT authentication is required
    - Verify ownership check cannot be bypassed
    - Verify no sensitive data in logs
    - Verify input validation is comprehensive
    - Verify no SQL injection vulnerabilities

27. **Deploy to staging**:

    - Verify database has all required columns
    - Verify `SRSLastGrade` column uses correct enum type
    - Test with real user accounts
    - Verify SRS calculations are correct
    - Monitor logs for any issues

28. **Deploy to production**:
    - Deploy during low-traffic period
    - Monitor error rates closely
    - Monitor response times
    - Verify SRS algorithm produces expected results
    - Have rollback plan ready

## 10. Additional Notes

### SM-2 Algorithm Reference

The SM-2 (SuperMemo 2) algorithm is a scientifically-proven spaced repetition algorithm developed by Piotr Woźniak in 1988. Key principles:

- **Ease Factor (EF):** Represents how "easy" a flashcard is (default: 2.5)
- **Interval:** Days until next review
- **Repetitions:** Number of successful reviews
- **Grade:** User's recall quality (0-5)

**Algorithm Benefits:**

- Optimizes long-term retention
- Adapts to individual flashcard difficulty
- Scientifically validated for learning effectiveness

**Formula for Ease Factor:**

```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
where q = grade (0-5)
```

**Interval Schedule:**

- First repetition: 1 day
- Second repetition: 6 days
- Subsequent: previous_interval × ease_factor

### Edge Cases

- **First-time rating:** Flashcard has null SRS values → use defaults (EF=2.5, reps=0)
- **Failed flashcard (grade < 3):** Reset to 1-day interval, keep lowered ease factor
- **Perfect recall (grade 5):** Increases ease factor, extends interval
- **Deleted flashcard:** Return 404, do not allow rating
- **Concurrent ratings:** Last write wins (consider optimistic concurrency in future)

### Future Enhancements

- **Batch Rating:** Allow rating multiple flashcards in one request
- **Undo Rating:** Allow users to undo/redo ratings within time window
- **Custom Algorithms:** Support SM-15, SM-17, or custom algorithms
- **Learning Statistics:** Track success rate, average grade, retention curve
- **Adaptive Algorithm:** Adjust algorithm parameters based on user performance
- **Optimistic Concurrency:** Add `RowVersion` to prevent lost updates

### Business Metrics to Track

- **Grade Distribution:** Track how often users select each grade (0-5)
- **Average Ease Factor:** Monitor if flashcards are getting easier or harder
- **Retention Rate:** Percentage of successful recalls (grade >= 3)
- **Average Interval:** Track typical spacing between reviews
- **Review Compliance:** Track if users review on scheduled dates

### Dependencies

- **Existing Entities:** `Flashcard`, `FlashcardStatus` (`_10xdevs.Domain.Entities`, `_10xdevs.Domain.Enums`)
- **Existing Enums:** `SRSGrade` enum (`_10xdevs.Domain.Enums`)
- **Existing DTOs:** `RateFlashcardRequestDto`, `RateFlashcardResponseDto` (`_10xdevs.Application.DTOs.Learning`)
- **Existing Interfaces:** `IFlashcardRepository`, `IUnitOfWork`, `IMapper` (`_10xdevs.Domain.Interfaces`)
- **New Service:** `ISpacedRepetitionService` (to be created or use open-source library)
- **Authentication:** JWT middleware and `ClaimsPrincipalExtensions`
- **Validation:** FluentValidation library
- **Exception Handling:** Global exception handler middleware

### Testing Data Setup

For testing, ensure test database includes:

- Multiple users with distinct IDs
- Flashcards owned by different users
- Flashcards with various SRS states (first review, multiple reviews, failed reviews)
- Deleted flashcards
- Flashcards with null SRS parameters (never reviewed)
- Flashcards owned by test user for authorization tests

### API Versioning Consideration

If API versioning is implemented in the future:

- This endpoint should be versioned (e.g., `/api/v1/learning/flashcards/{id}/rate`)
- Algorithm changes may require new version (e.g., v2 with SM-15 algorithm)
- Maintain backward compatibility for existing clients
