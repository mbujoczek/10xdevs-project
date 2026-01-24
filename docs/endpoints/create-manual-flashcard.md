# API Endpoint Implementation Plan: Create Manual Flashcard

## 1. Endpoint Overview

This endpoint allows authenticated users to manually create new flashcards by providing a question and answer. Created flashcards are marked with Source=Manual (1) and Status=NotApplicable (0), indicating they were not AI-generated and have no acceptance workflow status. The flashcard is initialized with default SRS algorithm parameters and is immediately available for learning sessions.

**Business Purpose:**

- Enable users to create custom flashcards from their own content
- Support manual flashcard creation alongside AI-generated flashcards
- Provide flexibility for users to add domain-specific knowledge
- Initialize flashcards ready for spaced repetition learning

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Pattern:** `/api/flashcards`
- **Authentication:** Required (JWT Bearer token)
- **Authorization:** Users can only create flashcards for themselves

### Request Body

**Required Fields:**

- `question` (string, required)
  - **Description:** The question text for the flashcard
  - **Constraints:**
    - Maximum 200 characters
    - Cannot be empty or whitespace
  - **Validation:** `[Required]`, `[MaxLength(200)]`
- `answer` (string, required)
  - **Description:** The answer text for the flashcard
  - **Constraints:**
    - Maximum 500 characters
    - Cannot be empty or whitespace
  - **Validation:** `[Required]`, `[MaxLength(500)]`

**Request Headers:**

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Example Request Body:**

```json
{
  "question": "What is Vue.js?",
  "answer": "Vue.js is a progressive JavaScript framework for building user interfaces."
}
```

**Additional Examples:**

```json
{
  "question": "What does CQRS stand for?",
  "answer": "Command Query Responsibility Segregation - an architectural pattern that separates read and write operations."
}
```

## 3. Types Used

### Command Model

```csharp
// Application/Commands/Flashcards/CreateManualFlashcard/CreateManualFlashcardCommand.cs
public class CreateManualFlashcardCommand : IRequest<FlashcardDto>
{
    public int UserId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}
```

### Request DTO (Existing)

```csharp
// Application/DTOs/Flashcards/CreateFlashcardRequestDto.cs
public class CreateFlashcardRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Question { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Answer { get; set; } = string.Empty;
}
```

### Response DTO (Existing)

```csharp
// Application/DTOs/Flashcards/FlashcardDto.cs
public class FlashcardDto
{
    public int Id { get; set; }
    public string Question { get; set; }
    public string Answer { get; set; }
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

### Command Validator

```csharp
// Application/Commands/Flashcards/CreateManualFlashcard/CreateManualFlashcardCommandValidator.cs
public class CreateManualFlashcardCommandValidator : AbstractValidator<CreateManualFlashcardCommand>
{
    public CreateManualFlashcardCommandValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0)
            .WithMessage("UserId must be greater than 0");

        RuleFor(x => x.Question)
            .NotEmpty()
            .WithMessage("Question is required")
            .MaximumLength(200)
            .WithMessage("Question must not exceed 200 characters");

        RuleFor(x => x.Answer)
            .NotEmpty()
            .WithMessage("Answer is required")
            .MaximumLength(500)
            .WithMessage("Answer must not exceed 500 characters");
    }
}
```

## 4. Response Details

### Success Response (201 Created)

**Status Code:** 201 Created

**Body:**

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

**Headers:**

```
Content-Type: application/json
Location: /api/flashcards/103
```

**Field Initialization:**

- `source`: Always set to `1` (Manual)
- `status`: Always set to `0` (NotApplicable)
- `srsInterval`: `null` (no learning sessions yet)
- `srsRepetitions`: `0` (no repetitions performed)
- `srsEaseFactor`: `2.5` (default SM-2 algorithm value)
- `srsNextRepetitionDate`: `null` (not scheduled)
- `srsLastGrade`: `null` (not rated yet)
- `createdAtUtc`: Current UTC timestamp
- `updatedAtUtc`: Current UTC timestamp (same as created)

### Error Responses

#### 400 Bad Request

**Scenario 1:** Validation errors (empty fields, exceeding length limits)

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
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

**Scenario 2:** Whitespace-only input

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation error",
  "status": 400,
  "errors": {
    "question": ["Question cannot be empty or whitespace"]
  }
}
```

#### 401 Unauthorized

**Scenario:** Missing or invalid JWT token

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication token is missing or invalid."
}
```

## 5. Data Flow

### Command Handler Flow

```
1. Controller receives POST request with CreateFlashcardRequestDto
2. ASP.NET model validation runs (DataAnnotations)
3. If validation fails, return 400 Bad Request
4. Extract UserId from JWT claims (ClaimsPrincipal)
5. Map DTO to CreateManualFlashcardCommand
6. Send command to MediatR
7. MediatR pipeline executes ValidationBehavior (FluentValidation)
8. If validation fails, throw ValidationException → 400 Bad Request
9. Handler receives command
10. Create new Flashcard entity:
    - UserId = from JWT
    - Question = from request
    - Answer = from request
    - Source = Manual (1)
    - Status = NotApplicable (0)
    - SRSRepetitions = 0
    - SRSEaseFactor = 2.5
    - SRSInterval = null
    - SRSNextRepetitionDate = null
    - SRSLastGrade = null
    - CreatedAtUtc = DateTime.UtcNow
    - UpdatedAtUtc = DateTime.UtcNow
11. Call Repository.CreateAsync(flashcard)
12. Repository saves to database
13. Database assigns Id (IDENTITY)
14. Map saved entity to FlashcardDto
15. Return FlashcardDto to controller
16. Controller returns 201 Created with Location header
```

### Database Insert

```sql
INSERT INTO Flashcards (
    UserId, Question, Answer, Source, Status,
    SRSRepetitions, SRSEaseFactor, SRSInterval,
    SRSNextRepetitionDate, SRSLastGrade,
    CreatedAtUtc, UpdatedAtUtc
)
VALUES (
    @userId, @question, @answer, 1, 0,
    0, 2.5, NULL,
    NULL, NULL,
    GETUTCDATE(), GETUTCDATE()
);

SELECT SCOPE_IDENTITY(); -- Returns new flashcard ID
```

## 6. Security Considerations

### Authentication

- **JWT Validation:** Endpoint requires valid Bearer token in Authorization header
- **Token Expiration:** Server validates token hasn't expired (12-hour validity)
- **Token Signature:** Server validates HMAC-SHA256 signature using secret key

### Authorization

- **User Data Isolation:** UserId extracted from JWT `sub` claim, never from request body
- **No Cross-User Creation:** Impossible to create flashcards for other users
- **Claim Validation:** Verify `sub` claim exists and contains valid integer UserId

### Input Validation

- **Two-Layer Validation:**
  1. DataAnnotations on DTO (ASP.NET model binding)
  2. FluentValidation in MediatR pipeline
- **XSS Prevention:** Sanitize question and answer text (trim, escape HTML if displayed)
- **Length Limits:** Enforce 200/500 character limits to prevent database overflow
- **SQL Injection Protection:** Use parameterized queries via Entity Framework

### Data Security

- **No Sensitive Data:** Request contains only question/answer text
- **Content Sanitization:** Trim whitespace, normalize line endings
- **Database Constraints:** CHECK constraints on Source and Status columns
- **Default Values:** Use database defaults where applicable

### Rate Limiting

- **Consider Implementing:** Rate limit flashcard creation (e.g., 100 per hour per user)
- **Prevents Abuse:** Protect against spam or automated attacks
- **Implementation:** Use middleware or distributed cache (Redis) for rate tracking

## 7. Error Handling

### Validation Errors (400)

**Scenario 1:** Empty question or answer

```csharp
// Handled by DataAnnotations and FluentValidation
[Required] attribute automatically returns 400
```

**Scenario 2:** Question exceeds 200 characters

```csharp
if (request.Question.Length > 200)
    return BadRequest("Question must not exceed 200 characters");
```

**Scenario 3:** Answer exceeds 500 characters

```csharp
if (request.Answer.Length > 500)
    return BadRequest("Answer must not exceed 500 characters");
```

**Scenario 4:** Whitespace-only input

```csharp
if (string.IsNullOrWhiteSpace(request.Question))
    return BadRequest("Question cannot be empty or whitespace");
```

### Authentication Errors (401)

**Scenario 1:** Missing Authorization header

```csharp
// Handled automatically by [Authorize] attribute
```

**Scenario 2:** Invalid or expired token

```csharp
// Handled automatically by [Authorize] attribute
// Returns 401 Unauthorized with standard problem details
```

### System Errors (500)

**Scenario 1:** Database connection failure

```csharp
try
{
    await _flashcardRepository.CreateAsync(flashcard, cancellationToken);
}
catch (DbUpdateException ex)
{
    _logger.LogError(ex,
        "Failed to create flashcard for user {UserId}", userId);
    return StatusCode(500, "An error occurred while creating the flashcard");
}
```

**Scenario 2:** Unique constraint violation (unlikely but possible)

```csharp
catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UNIQUE") == true)
{
    _logger.LogWarning(ex, "Duplicate flashcard attempt for user {UserId}", userId);
    return Conflict("A flashcard with this question already exists");
}
```

**Logging:** Use structured logging with Serilog to capture:

- UserId
- Question length and first 50 characters (for debugging)
- Exception details
- Request correlation ID

## 8. Performance Considerations

### Database Optimization

- **Single Insert:** One INSERT statement per flashcard
- **Transaction:** Use implicit transaction (no distributed transaction needed)
- **Index Impact:** New row added to indexes (PK, UserId, composite)
- **Execution Time:** ~5-10ms average for insert

### Validation Performance

- **Two-Stage Validation:** DataAnnotations (fast) + FluentValidation (slightly slower)
- **String Operations:** Trim whitespace, length checks are O(1)
- **No External Calls:** Pure computation, no API calls

### Response Time Goals

- **Target:** <50ms end-to-end
- **Breakdown:**
  - Validation: ~5ms
  - Database insert: ~10ms
  - Mapping: ~1ms
  - Response serialization: ~2ms

### Scalability

- **Concurrent Inserts:** Database handles concurrent inserts efficiently
- **No Locks:** No row-level locks for inserts
- **Connection Pooling:** Use default EF Core connection pooling
- **Stateless Operation:** No session state, scales horizontally

### Monitoring

- **Metrics to Track:**
  - Average flashcard creation time
  - 95th percentile creation time
  - Creation rate per user
  - Validation failure rate
  - Database insert latency

## 9. Implementation Steps

### Step 1: Create Command and Handler

1. Create `Application/Commands/Flashcards/CreateManualFlashcard/` folder
2. Create `CreateManualFlashcardCommand.cs`:
   ```csharp
   public class CreateManualFlashcardCommand : IRequest<FlashcardDto>
   {
       public int UserId { get; set; }
       public string Question { get; set; } = string.Empty;
       public string Answer { get; set; } = string.Empty;
   }
   ```
3. Create `CreateManualFlashcardCommandHandler.cs`:

   ```csharp
   public class CreateManualFlashcardCommandHandler
       : IRequestHandler<CreateManualFlashcardCommand, FlashcardDto>
   {
       private readonly IFlashcardRepository _flashcardRepository;
       private readonly IMapper _mapper;
       private readonly ILogger<CreateManualFlashcardCommandHandler> _logger;

       public async Task<FlashcardDto> Handle(
           CreateManualFlashcardCommand request,
           CancellationToken cancellationToken)
       {
           var flashcard = new Flashcard
           {
               UserId = request.UserId,
               Question = request.Question.Trim(),
               Answer = request.Answer.Trim(),
               Source = FlashcardSource.Manual,
               Status = FlashcardStatus.NotApplicable,
               SRSRepetitions = 0,
               SRSEaseFactor = 2.5m,
               SRSInterval = null,
               SRSNextRepetitionDate = null,
               SRSLastGrade = null,
               CreatedAtUtc = DateTime.UtcNow,
               UpdatedAtUtc = DateTime.UtcNow
           };

           var createdFlashcard = await _flashcardRepository.CreateAsync(
               flashcard,
               cancellationToken);

           _logger.LogInformation(
               "Created manual flashcard {FlashcardId} for user {UserId}",
               createdFlashcard.Id, request.UserId);

           return _mapper.Map<FlashcardDto>(createdFlashcard);
       }
   }
   ```

### Step 2: Create Command Validator

1. Create `CreateManualFlashcardCommandValidator.cs`:

   ```csharp
   public class CreateManualFlashcardCommandValidator
       : AbstractValidator<CreateManualFlashcardCommand>
   {
       public CreateManualFlashcardCommandValidator()
       {
           RuleFor(x => x.UserId)
               .GreaterThan(0)
               .WithMessage("UserId must be greater than 0");

           RuleFor(x => x.Question)
               .NotEmpty()
               .WithMessage("Question is required")
               .MaximumLength(200)
               .WithMessage("Question must not exceed 200 characters")
               .Must(q => !string.IsNullOrWhiteSpace(q))
               .WithMessage("Question cannot be empty or whitespace");

           RuleFor(x => x.Answer)
               .NotEmpty()
               .WithMessage("Answer is required")
               .MaximumLength(500)
               .WithMessage("Answer must not exceed 500 characters")
               .Must(a => !string.IsNullOrWhiteSpace(a))
               .WithMessage("Answer cannot be empty or whitespace");
       }
   }
   ```

### Step 3: Repository Method Already Exists

1. Verify `IFlashcardRepository.CreateAsync` exists:
   ```csharp
   Task<Flashcard> CreateAsync(
       Flashcard flashcard,
       CancellationToken cancellationToken = default);
   ```
2. Implementation should already exist in `FlashcardRepository`

### Step 4: Configure AutoMapper

1. Mapping already exists:
   ```csharp
   CreateMap<Flashcard, FlashcardDto>();
   ```

### Step 5: Create Controller Endpoint

1. Update `Api/Controllers/FlashcardsController.cs`:

   ```csharp
   [HttpPost]
   [Authorize]
   public async Task<ActionResult<FlashcardDto>> CreateFlashcard(
       [FromBody] CreateFlashcardRequestDto request,
       CancellationToken cancellationToken)
   {
       var userId = User.GetUserId();

       var command = new CreateManualFlashcardCommand
       {
           UserId = userId,
           Question = request.Question,
           Answer = request.Answer
       };

       var flashcard = await _mediator.Send(command, cancellationToken);

       return CreatedAtAction(
           nameof(GetFlashcard),
           new { id = flashcard.Id },
           flashcard);
   }
   ```

### Step 6: Add Validation Behavior (if not exists)

1. Check if `Application/Behaviors/ValidationBehavior.cs` exists
2. If not, create it to run FluentValidation in MediatR pipeline:

   ```csharp
   public class ValidationBehavior<TRequest, TResponse>
       : IPipelineBehavior<TRequest, TResponse>
       where TRequest : IRequest<TResponse>
   {
       private readonly IEnumerable<IValidator<TRequest>> _validators;

       public async Task<TResponse> Handle(
           TRequest request,
           RequestHandlerDelegate<TResponse> next,
           CancellationToken cancellationToken)
       {
           if (_validators.Any())
           {
               var context = new ValidationContext<TRequest>(request);

               var validationResults = await Task.WhenAll(
                   _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

               var failures = validationResults
                   .SelectMany(r => r.Errors)
                   .Where(f => f != null)
                   .ToList();

               if (failures.Any())
                   throw new ValidationException(failures);
           }

           return await next();
       }
   }
   ```

### Step 7: Register Validation Behavior

1. Update `Application/Extensions/ServiceCollectionExtensions.cs`:

   ```csharp
   services.AddMediatR(cfg => {
       cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
       cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
   });

   services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
   ```

### Step 8: Add Unit Tests

1. Create `Application.Tests/Commands/CreateManualFlashcardCommandHandlerTests.cs`
2. Test scenarios:
   - Creates flashcard with correct Source (Manual)
   - Creates flashcard with correct Status (NotApplicable)
   - Initializes SRS parameters correctly
   - Trims whitespace from question and answer
   - Returns FlashcardDto with new ID
   - Sets CreatedAtUtc and UpdatedAtUtc
   - Maps all properties correctly

### Step 9: Add Validator Tests

1. Create `Application.Tests/Commands/CreateManualFlashcardCommandValidatorTests.cs`
2. Test scenarios:
   - Validates empty question returns error
   - Validates empty answer returns error
   - Validates question exceeding 200 characters returns error
   - Validates answer exceeding 500 characters returns error
   - Validates whitespace-only question returns error
   - Validates whitespace-only answer returns error
   - Validates valid input passes

### Step 10: Add Integration Tests

1. Create or update `Api.Tests/Controllers/FlashcardsControllerTests.cs`
2. Test scenarios:
   - POST /api/flashcards returns 201 with flashcard
   - Returns 401 when not authenticated
   - Returns 400 for invalid request (empty fields)
   - Returns 400 for exceeding length limits
   - Returns Location header pointing to new flashcard
   - Flashcard is retrievable via GET after creation
   - Source is Manual (1) and Status is NotApplicable (0)

### Step 11: Update Swagger Documentation

1. Add XML comments to controller action:
   ```csharp
   /// <summary>
   /// Creates a new flashcard manually
   /// </summary>
   /// <param name="request">Flashcard question and answer</param>
   /// <returns>Created flashcard with assigned ID</returns>
   /// <response code="201">Returns the newly created flashcard</response>
   /// <response code="400">Validation failed</response>
   /// <response code="401">Unauthorized - invalid or missing token</response>
   ```
2. Add request/response examples using Swashbuckle attributes

### Step 12: Add Logging

1. Add structured logging in handler (already in Step 1)
2. Add logging for validation failures:
   ```csharp
   catch (ValidationException ex)
   {
       _logger.LogWarning(
           "Validation failed for flashcard creation by user {UserId}: {Errors}",
           userId, ex.Errors);
   }
   ```

### Step 13: Test and Validate

1. Manual testing with Swagger UI or Postman
2. Create flashcard with valid data
3. Test validation errors (empty fields, too long)
4. Verify 201 status code and Location header
5. Verify Source=Manual and Status=NotApplicable
6. Verify SRS parameters initialized correctly
7. Retrieve created flashcard via GET endpoint
8. Check database to verify insert
