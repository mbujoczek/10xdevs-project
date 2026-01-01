# API Endpoint Implementation Plan: Update Flashcard

## 1. Endpoint Overview

This endpoint allows authenticated users to update the question and/or answer of an existing flashcard. Only flashcards owned by the authenticated user can be modified. Deleted flashcards cannot be updated. The UpdatedAtUtc timestamp is automatically set to the current UTC time when the flashcard is modified. The endpoint preserves all other flashcard properties including SRS algorithm parameters and metadata.

**Business Purpose:**

- Enable users to correct mistakes in flashcards
- Allow refinement of question or answer wording
- Support iterative improvement of flashcard content
- Maintain flashcard history through UpdatedAtUtc timestamp

## 2. Request Details

- **HTTP Method:** `PUT`
- **URL Pattern:** `/api/flashcards/{id}`
- **Authentication:** Required (JWT Bearer token)
- **Authorization:** Users can only update their own flashcards

### Path Parameters

**Required Parameters:**

- `id` (integer, required)
  - **Description:** Unique flashcard identifier
  - **Constraints:** Must be positive integer
  - **Example:** `/api/flashcards/103`

### Request Body

**Required Fields:**

- `question` (string, required)
  - **Description:** Updated question text for the flashcard
  - **Constraints:**
    - Maximum 200 characters
    - Cannot be empty or whitespace
  - **Validation:** `[Required]`, `[MaxLength(200)]`
- `answer` (string, required)
  - **Description:** Updated answer text for the flashcard
  - **Constraints:**
    - Maximum 500 characters
    - Cannot be empty or whitespace
  - **Validation:** `[Required]`, `[MaxLength(500)]`

**Request Headers:**

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Example Request:**

```
PUT /api/flashcards/103
```

**Request Body:**

```json
{
  "question": "What is Vue 3?",
  "answer": "Vue 3 is the latest major version of Vue.js with Composition API support."
}
```

**Additional Example:**

```json
{
  "question": "What does CQRS stand for in software architecture?",
  "answer": "Command Query Responsibility Segregation - a pattern that separates read and write operations into different models."
}
```

## 3. Types Used

### Command Model

```csharp
// Application/Commands/Flashcards/UpdateFlashcard/UpdateFlashcardCommand.cs
public class UpdateFlashcardCommand : IRequest<FlashcardDto>
{
    public int FlashcardId { get; set; }
    public int UserId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}
```

### Request DTO (Existing)

```csharp
// Application/DTOs/Flashcards/UpdateFlashcardRequestDto.cs
public class UpdateFlashcardRequestDto
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
// Application/Commands/Flashcards/UpdateFlashcard/UpdateFlashcardCommandValidator.cs
public class UpdateFlashcardCommandValidator : AbstractValidator<UpdateFlashcardCommand>
{
    public UpdateFlashcardCommandValidator()
    {
        RuleFor(x => x.FlashcardId)
            .GreaterThan(0)
            .WithMessage("FlashcardId must be greater than 0");

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

## 4. Response Details

### Success Response (200 OK)

**Status Code:** 200 OK

**Body:**

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

**Headers:**

```
Content-Type: application/json
```

**Updated Fields:**

- `question`: Updated to new value from request
- `answer`: Updated to new value from request
- `updatedAtUtc`: Set to current UTC timestamp

**Preserved Fields:**

- `id`: Unchanged
- `source`: Unchanged (Manual or AI)
- `status`: Unchanged (NotApplicable, Accepted, Edited)
- `srsInterval`: Unchanged
- `srsRepetitions`: Unchanged
- `srsEaseFactor`: Unchanged
- `srsNextRepetitionDate`: Unchanged
- `srsLastGrade`: Unchanged
- `createdAtUtc`: Unchanged (original creation time)

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

**Scenario 2:** Invalid flashcard ID format

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "id": ["The value 'abc' is not valid for id."]
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

#### 403 Forbidden

**Scenario:** Flashcard belongs to a different user

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have permission to update this flashcard."
}
```

#### 404 Not Found

**Scenario 1:** Flashcard doesn't exist
**Scenario 2:** Flashcard is soft-deleted (Status = Deleted)

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Flashcard with ID 103 was not found."
}
```

## 5. Data Flow

### Command Handler Flow

```
1. Controller receives PUT request with flashcard ID in route and UpdateFlashcardRequestDto
2. ASP.NET model validation runs (DataAnnotations)
3. If validation fails, return 400 Bad Request
4. Extract UserId from JWT claims (ClaimsPrincipal)
5. Map DTO to UpdateFlashcardCommand
6. Send command to MediatR
7. MediatR pipeline executes ValidationBehavior (FluentValidation)
8. If validation fails, throw ValidationException → 400 Bad Request
9. Handler receives command
10. Call Repository.GetByIdAsync(flashcardId, userId) to retrieve flashcard
11. If flashcard is null (doesn't exist or deleted):
    - Throw NotFoundException → 404 Not Found
12. If flashcard.UserId != userId (redundant check):
    - Throw ForbiddenException → 403 Forbidden
13. Update flashcard properties:
    - Question = request.Question.Trim()
    - Answer = request.Answer.Trim()
    - UpdatedAtUtc = DateTime.UtcNow
14. Call Repository.UpdateAsync(flashcard) or UnitOfWork.SaveChangesAsync()
15. Repository updates database (EF Core change tracking)
16. Map updated entity to FlashcardDto
17. Return FlashcardDto to controller
18. Controller returns 200 OK with response body
```

### Database Update

```sql
UPDATE Flashcards
SET
    Question = @question,
    Answer = @answer,
    UpdatedAtUtc = GETUTCDATE()
WHERE Id = @flashcardId
    AND UserId = @userId
    AND Status != 3;  -- Exclude deleted flashcards

-- If @@ROWCOUNT = 0, flashcard not found or already deleted
```

**Concurrency Handling:**

- Consider adding RowVersion/Timestamp column for optimistic concurrency
- EF Core will handle concurrency conflicts automatically if configured

## 6. Security Considerations

### Authentication

- **JWT Validation:** Endpoint requires valid Bearer token in Authorization header
- **Token Expiration:** Server validates token hasn't expired (12-hour validity)
- **Token Signature:** Server validates HMAC-SHA256 signature using secret key

### Authorization

- **User Data Isolation:** UserId extracted from JWT `sub` claim, never from request
- **Ownership Verification:** Query filters by both FlashcardId AND UserId
- **Cross-User Prevention:** Attempting to update another user's flashcard returns 404
- **Claim Validation:** Verify `sub` claim exists and contains valid integer UserId

### Input Validation

- **Two-Layer Validation:**
  1. DataAnnotations on DTO (ASP.NET model binding)
  2. FluentValidation in MediatR pipeline
- **XSS Prevention:** Sanitize question and answer text (trim, escape HTML if displayed)
- **Length Limits:** Enforce 200/500 character limits to prevent database overflow
- **SQL Injection Protection:** Use parameterized queries via Entity Framework

### Data Security

- **Soft Delete Protection:** Cannot update flashcards with Status=Deleted (3)
- **Preserve Metadata:** Cannot modify Source, Status, or SRS parameters via this endpoint
- **Audit Trail:** UpdatedAtUtc provides modification timestamp
- **Content Sanitization:** Trim whitespace, normalize line endings

### Privacy Considerations

- **404 vs 403 Response:** Return 404 for both non-existent and unauthorized access to prevent user enumeration
- **Error Message Sanitization:** Don't reveal whether flashcard exists if user doesn't own it

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

### Authorization Errors (403)

**Scenario:** Flashcard belongs to different user

```csharp
// Option 1: Return 404 to prevent user enumeration (RECOMMENDED)
if (flashcard == null || flashcard.UserId != userId)
    throw new NotFoundException($"Flashcard with ID {flashcardId} was not found.");

// Option 2: Return explicit 403 (less secure)
if (flashcard.UserId != userId)
    throw new ForbiddenException("You do not have permission to update this flashcard.");
```

### Not Found Errors (404)

**Scenario 1:** Flashcard doesn't exist in database

```csharp
var flashcard = await _flashcardRepository.GetByIdAsync(flashcardId, userId, cancellationToken);
if (flashcard == null)
    throw new NotFoundException($"Flashcard with ID {flashcardId} was not found.");
```

**Scenario 2:** Flashcard is soft-deleted

```csharp
// Repository query automatically excludes Status=Deleted
// Returns null, which triggers NotFoundException
```

### Concurrency Errors (409)

**Scenario:** Concurrent update conflict (if RowVersion implemented)

```csharp
catch (DbUpdateConcurrencyException ex)
{
    _logger.LogWarning(ex,
        "Concurrency conflict updating flashcard {FlashcardId}", flashcardId);
    return Conflict("The flashcard has been modified by another process. Please reload and try again.");
}
```

### System Errors (500)

**Scenario:** Database connection failure, unexpected exceptions

```csharp
try
{
    await _unitOfWork.SaveChangesAsync(cancellationToken);
}
catch (Exception ex)
{
    _logger.LogError(ex,
        "Failed to update flashcard {FlashcardId} for user {UserId}",
        flashcardId, userId);
    return StatusCode(500, "An error occurred while updating the flashcard");
}
```

**Logging:** Use structured logging with Serilog to capture:

- UserId
- FlashcardId
- Original and new values (for audit trail)
- Exception details
- Request correlation ID

## 8. Performance Considerations

### Database Optimization

- **Primary Key Lookup:** Fast retrieval using clustered index
- **Single UPDATE:** One UPDATE statement per flashcard
- **Transaction:** Use implicit transaction (or explicit if needed)
- **Index Impact:** Updated row may need index reorg (minimal impact)
- **Execution Time:** ~5-15ms average (retrieve + update)

### Change Tracking

- **EF Core Change Tracking:** Automatically detects modified properties
- **Optimized Updates:** Only modified columns are included in UPDATE statement
- **No Unnecessary Updates:** Skip update if no properties changed

### Validation Performance

- **Two-Stage Validation:** DataAnnotations (fast) + FluentValidation (slightly slower)
- **String Operations:** Trim whitespace, length checks are O(1)
- **No External Calls:** Pure computation, no API calls

### Response Time Goals

- **Target:** <75ms end-to-end
- **Breakdown:**
  - Validation: ~5ms
  - Database retrieval: ~5ms
  - Database update: ~10ms
  - Mapping: ~1ms
  - Response serialization: ~2ms

### Concurrency

- **Optimistic Concurrency:** Consider adding RowVersion for conflict detection
- **Pessimistic Locking:** Not recommended (reduces scalability)
- **Last-Write-Wins:** Default behavior without concurrency handling

### Monitoring

- **Metrics to Track:**
  - Average update time
  - 95th percentile update time
  - Update rate per user
  - Validation failure rate
  - Concurrency conflict rate (if implemented)
  - 404 rate (invalid flashcard access)

## 9. Implementation Steps

### Step 1: Create Command and Handler

1. Create `Application/Commands/Flashcards/UpdateFlashcard/` folder
2. Create `UpdateFlashcardCommand.cs`:
   ```csharp
   public class UpdateFlashcardCommand : IRequest<FlashcardDto>
   {
       public int FlashcardId { get; set; }
       public int UserId { get; set; }
       public string Question { get; set; } = string.Empty;
       public string Answer { get; set; } = string.Empty;
   }
   ```
3. Create `UpdateFlashcardCommandHandler.cs`:

   ```csharp
   public class UpdateFlashcardCommandHandler
       : IRequestHandler<UpdateFlashcardCommand, FlashcardDto>
   {
       private readonly IFlashcardRepository _flashcardRepository;
       private readonly IUnitOfWork _unitOfWork;
       private readonly IMapper _mapper;
       private readonly ILogger<UpdateFlashcardCommandHandler> _logger;

       public async Task<FlashcardDto> Handle(
           UpdateFlashcardCommand request,
           CancellationToken cancellationToken)
       {
           var flashcard = await _flashcardRepository.GetByIdAsync(
               request.FlashcardId,
               request.UserId,
               cancellationToken);

           if (flashcard == null)
           {
               throw new NotFoundException(
                   $"Flashcard with ID {request.FlashcardId} was not found.");
           }

           // Update only question, answer, and timestamp
           flashcard.Question = request.Question.Trim();
           flashcard.Answer = request.Answer.Trim();
           flashcard.UpdatedAtUtc = DateTime.UtcNow;

           await _unitOfWork.SaveChangesAsync(cancellationToken);

           _logger.LogInformation(
               "Updated flashcard {FlashcardId} for user {UserId}",
               flashcard.Id, request.UserId);

           return _mapper.Map<FlashcardDto>(flashcard);
       }
   }
   ```

### Step 2: Create Command Validator

1. Create `UpdateFlashcardCommandValidator.cs`:

   ```csharp
   public class UpdateFlashcardCommandValidator
       : AbstractValidator<UpdateFlashcardCommand>
   {
       public UpdateFlashcardCommandValidator()
       {
           RuleFor(x => x.FlashcardId)
               .GreaterThan(0)
               .WithMessage("FlashcardId must be greater than 0");

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

### Step 3: Repository Methods Already Exist

1. `IFlashcardRepository.GetByIdAsync` should already exist from GET endpoint
2. Update mechanism uses EF Core change tracking + UnitOfWork pattern

### Step 4: Create Controller Endpoint

1. Update `Api/Controllers/FlashcardsController.cs`:

   ```csharp
   [HttpPut("{id}")]
   [Authorize]
   public async Task<ActionResult<FlashcardDto>> UpdateFlashcard(
       int id,
       [FromBody] UpdateFlashcardRequestDto request,
       CancellationToken cancellationToken)
   {
       var userId = User.GetUserId();

       var command = new UpdateFlashcardCommand
       {
           FlashcardId = id,
           UserId = userId,
           Question = request.Question,
           Answer = request.Answer
       };

       var flashcard = await _mediator.Send(command, cancellationToken);

       return Ok(flashcard);
   }
   ```

### Step 8: Update Swagger Documentation

1. Add XML comments to controller action:
   ```csharp
   /// <summary>
   /// Updates an existing flashcard's question and/or answer
   /// </summary>
   /// <param name="id">Flashcard identifier</param>
   /// <param name="request">Updated question and answer</param>
   /// <returns>Updated flashcard with modified timestamp</returns>
   /// <response code="200">Returns the updated flashcard</response>
   /// <response code="400">Validation failed</response>
   /// <response code="401">Unauthorized - invalid or missing token</response>
   /// <response code="403">Forbidden - flashcard belongs to another user</response>
   /// <response code="404">Not found - flashcard doesn't exist or is deleted</response>
   ```
2. Add request/response examples using Swashbuckle attributes

### Step 9: Add Logging

1. Add structured logging in handler (already in Step 1)
2. Add logging for not found cases:
   ```csharp
   _logger.LogWarning(
       "Attempted to update non-existent flashcard {FlashcardId} by user {UserId}",
       request.FlashcardId, request.UserId);
   ```

### Step 11: Test and Validate

1. Manual testing with Swagger UI or Postman
2. Update flashcard with valid data
3. Test validation errors (empty fields, too long)
4. Verify 200 status code
5. Verify UpdatedAtUtc is updated
6. Verify CreatedAtUtc is preserved
7. Verify SRS parameters are preserved
8. Test with non-existent flashcard (should return 404)
9. Test with another user's flashcard (should return 404)
10. Test with deleted flashcard (should return 404)
11. Check database to verify update
