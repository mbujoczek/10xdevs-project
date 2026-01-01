# API Endpoint Implementation Plan: Delete Flashcard

## 1. Endpoint Overview

This endpoint performs a soft delete on an existing flashcard by changing its Status to Deleted (3). The flashcard remains in the database but becomes inaccessible through all other API endpoints. Only flashcards owned by the authenticated user can be deleted. Already deleted flashcards cannot be deleted again. The endpoint returns no content (204 No Content) on successful deletion.

**Business Purpose:**

- Enable users to remove unwanted flashcards from their collection
- Preserve data integrity through soft delete (no physical deletion)
- Maintain referential integrity with FlashcardGenerationEvents
- Support potential future data recovery or audit requirements
- Hide deleted flashcards from all user-facing queries

## 2. Request Details

- **HTTP Method:** `DELETE`
- **URL Pattern:** `/api/flashcards/{id}`
- **Authentication:** Required (JWT Bearer token)
- **Authorization:** Users can only delete their own flashcards

### Path Parameters

**Required Parameters:**

- `id` (integer, required)
  - **Description:** Unique flashcard identifier
  - **Constraints:** Must be positive integer
  - **Example:** `/api/flashcards/103`

**Request Headers:**

```
Authorization: Bearer {jwt_token}
```

**Example Requests:**

```
DELETE /api/flashcards/103
DELETE /api/flashcards/52
```

**No Request Body Required**

## 3. Types Used

### Command Model

```csharp
// Application/Commands/Flashcards/DeleteFlashcard/DeleteFlashcardCommand.cs
public class DeleteFlashcardCommand : IRequest<Unit>
{
    public int FlashcardId { get; set; }
    public int UserId { get; set; }
}
```

**Note:** Returns `Unit` (MediatR's void equivalent) since no response body is needed

### Command Validator

```csharp
// Application/Commands/Flashcards/DeleteFlashcard/DeleteFlashcardCommandValidator.cs
public class DeleteFlashcardCommandValidator : AbstractValidator<DeleteFlashcardCommand>
{
    public DeleteFlashcardCommandValidator()
    {
        RuleFor(x => x.FlashcardId)
            .GreaterThan(0)
            .WithMessage("FlashcardId must be greater than 0");

        RuleFor(x => x.UserId)
            .GreaterThan(0)
            .WithMessage("UserId must be greater than 0");
    }
}
```

## 4. Response Details

### Success Response (204 No Content)

**Status Code:** 204 No Content

**Body:** Empty (no content)

**Headers:**

```
Content-Length: 0
```

**Database State After Deletion:**

- `Status` changed from current value to `3` (Deleted)
- `UpdatedAtUtc` set to current UTC timestamp
- All other fields preserved (Question, Answer, Source, SRS parameters)
- Flashcard excluded from all future queries by default

### Error Responses

#### 400 Bad Request

**Scenario:** Invalid flashcard ID format (non-numeric)

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
  "detail": "You do not have permission to delete this flashcard."
}
```

#### 404 Not Found

**Scenario 1:** Flashcard doesn't exist in database
**Scenario 2:** Flashcard is already deleted (Status = Deleted)

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Flashcard with ID 103 was not found."
}
```

**Design Decision:** Return 404 for already-deleted flashcards to maintain consistency with GET/PUT endpoints and prevent information disclosure about deleted items.

## 5. Data Flow

### Command Handler Flow

```
1. Controller receives DELETE request with flashcard ID in route
2. Extract UserId from JWT claims (ClaimsPrincipal)
3. Validate flashcard ID is positive integer
4. Create DeleteFlashcardCommand with FlashcardId and UserId
5. Send command to MediatR
6. Handler receives command
7. Call Repository.GetByIdAsync(flashcardId, userId) to retrieve flashcard
8. If flashcard is null (doesn't exist or already deleted):
   - Throw NotFoundException → 404 Not Found
9. If flashcard.UserId != userId (redundant check):
   - Throw ForbiddenException → 403 Forbidden
10. Update flashcard properties:
    - Status = FlashcardStatus.Deleted (3)
    - UpdatedAtUtc = DateTime.UtcNow
11. Call UnitOfWork.SaveChangesAsync() to persist changes
12. Return Unit.Value (success, no content)
13. Controller returns 204 No Content
```

### Database Update (Soft Delete)

```sql
UPDATE Flashcards
SET
    Status = 3,  -- Deleted
    UpdatedAtUtc = GETUTCDATE()
WHERE Id = @flashcardId
    AND UserId = @userId
    AND Status != 3;  -- Only update if not already deleted

-- If @@ROWCOUNT = 0, flashcard not found or already deleted
```

**Why Soft Delete?**

- Maintains referential integrity with FlashcardGenerationEvents
- Preserves historical data for analytics and metrics
- Enables potential data recovery in the future
- Complies with audit and compliance requirements
- Prevents cascading deletes in related tables

**Query Impact:**
All queries must filter by `Status != Deleted (3)`:

```sql
WHERE UserId = @userId AND Status != 3
```

## 6. Security Considerations

### Authentication

- **JWT Validation:** Endpoint requires valid Bearer token in Authorization header
- **Token Expiration:** Server validates token hasn't expired (12-hour validity)
- **Token Signature:** Server validates HMAC-SHA256 signature using secret key

### Authorization

- **User Data Isolation:** UserId extracted from JWT `sub` claim, never from request
- **Ownership Verification:** Query filters by both FlashcardId AND UserId
- **Cross-User Prevention:** Attempting to delete another user's flashcard returns 404
- **Claim Validation:** Verify `sub` claim exists and contains valid integer UserId

### Data Security

- **Soft Delete Only:** Physical deletion not supported in MVP
- **Double Delete Prevention:** Already deleted flashcards return 404
- **Preserve Metadata:** All flashcard data retained in database
- **Audit Trail:** UpdatedAtUtc provides deletion timestamp

### Privacy Considerations

- **404 vs 403 Response:** Return 404 for both non-existent and unauthorized access to prevent user enumeration
- **Error Message Sanitization:** Don't reveal whether flashcard exists if user doesn't own it
- **Information Disclosure:** Deleted flashcards behave identically to non-existent flashcards in API responses

### Input Validation

- **ID Validation:** Verify flashcard ID is valid positive integer
- **SQL Injection Protection:** Use parameterized queries via Entity Framework
- **Path Traversal Prevention:** ID is integer, no file system access risk

## 7. Error Handling

### Validation Errors (400)

**Scenario:** Invalid ID format

```csharp
// Automatically handled by model binding
// If ID is non-numeric, ASP.NET returns 400 automatically
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
    throw new ForbiddenException("You do not have permission to delete this flashcard.");
```

### Not Found Errors (404)

**Scenario 1:** Flashcard doesn't exist in database

```csharp
var flashcard = await _flashcardRepository.GetByIdAsync(flashcardId, userId, cancellationToken);
if (flashcard == null)
    throw new NotFoundException($"Flashcard with ID {flashcardId} was not found.");
```

**Scenario 2:** Flashcard is already soft-deleted

```csharp
// Repository query automatically excludes Status=Deleted
// Returns null, which triggers NotFoundException
```

**Idempotency Consideration:**

- **Question:** Should DELETE be idempotent (multiple deletes succeed)?
- **Answer:** No. Return 404 for already-deleted flashcards to maintain consistency with GET/PUT endpoints.
- **Rationale:** Client can distinguish between "never existed" vs "already deleted" through proper error handling.

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
        "Failed to delete flashcard {FlashcardId} for user {UserId}",
        flashcardId, userId);
    return StatusCode(500, "An error occurred while deleting the flashcard");
}
```

**Logging:** Use structured logging with Serilog to capture:

- UserId
- FlashcardId
- Previous Status value (for audit)
- Exception details
- Request correlation ID

## 8. Performance Considerations

### Database Optimization

- **Primary Key Lookup:** Fast retrieval using clustered index
- **Single UPDATE:** One UPDATE statement per deletion
- **Transaction:** Use implicit transaction (no distributed transaction needed)
- **Index Impact:** Updated row may need index reorg (minimal impact)
- **Execution Time:** ~5-15ms average (retrieve + update)

### Soft Delete Impact

- **Storage:** Deleted flashcards remain in database (minimal storage impact)
- **Query Performance:** All queries must filter `Status != 3` (already indexed)
- **Index Usage:** `IX_Flashcards_UserId_Status` composite index handles filtering
- **Cleanup Strategy:** Consider periodic archival of deleted flashcards (post-MVP)

### Response Time Goals

- **Target:** <50ms end-to-end
- **Breakdown:**
  - Validation: ~2ms
  - Database retrieval: ~5ms
  - Database update: ~8ms
  - Response: ~1ms (empty body)

### Monitoring

- **Metrics to Track:**
  - Average deletion time
  - Deletion rate per user
  - 404 rate (invalid flashcard access)
  - Deleted flashcards count over time
  - Storage growth rate

### Cleanup and Archival (Future Consideration)

- **Retention Policy:** Keep deleted flashcards for 30-90 days
- **Archive Process:** Move to separate archive table or cold storage
- **Hard Delete:** Permanently delete archived flashcards older than retention period
- **Implementation:** Background job or scheduled task

## 9. Implementation Steps

### Step 1: Create Command and Handler

1. Create `Application/Commands/Flashcards/DeleteFlashcard/` folder
2. Create `DeleteFlashcardCommand.cs`:
   ```csharp
   public class DeleteFlashcardCommand : IRequest<Unit>
   {
       public int FlashcardId { get; set; }
       public int UserId { get; set; }
   }
   ```
3. Create `DeleteFlashcardCommandHandler.cs`:

   ```csharp
   public class DeleteFlashcardCommandHandler
       : IRequestHandler<DeleteFlashcardCommand, Unit>
   {
       private readonly IFlashcardRepository _flashcardRepository;
       private readonly IUnitOfWork _unitOfWork;
       private readonly ILogger<DeleteFlashcardCommandHandler> _logger;

       public async Task<Unit> Handle(
           DeleteFlashcardCommand request,
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

           // Soft delete: change status to Deleted
           flashcard.Status = FlashcardStatus.Deleted;
           flashcard.UpdatedAtUtc = DateTime.UtcNow;

           await _unitOfWork.SaveChangesAsync(cancellationToken);

           _logger.LogInformation(
               "Soft deleted flashcard {FlashcardId} for user {UserId}",
               request.FlashcardId, request.UserId);

           return Unit.Value;
       }
   }
   ```

### Step 2: Create Command Validator

1. Create `DeleteFlashcardCommandValidator.cs`:

   ```csharp
   public class DeleteFlashcardCommandValidator
       : AbstractValidator<DeleteFlashcardCommand>
   {
       public DeleteFlashcardCommandValidator()
       {
           RuleFor(x => x.FlashcardId)
               .GreaterThan(0)
               .WithMessage("FlashcardId must be greater than 0");

           RuleFor(x => x.UserId)
               .GreaterThan(0)
               .WithMessage("UserId must be greater than 0");
       }
   }
   ```

### Step 3: Repository Methods Already Exist

1. `IFlashcardRepository.GetByIdAsync` should already exist from GET endpoint
2. Update mechanism uses EF Core change tracking + UnitOfWork pattern
3. No additional repository methods needed

### Step 4: Create Controller Endpoint

1. Update `Api/Controllers/FlashcardsController.cs`:

   ```csharp
   [HttpDelete("{id}")]
   [Authorize]
   public async Task<IActionResult> DeleteFlashcard(
       int id,
       CancellationToken cancellationToken)
   {
       var userId = User.GetUserId();

       var command = new DeleteFlashcardCommand
       {
           FlashcardId = id,
           UserId = userId
       };

       await _mediator.Send(command, cancellationToken);

       return NoContent(); // 204 No Content
   }
   ```

### Step 5: Verify Query Filters

1. Ensure all existing queries filter out deleted flashcards:

   ```csharp
   // GetByIdAsync
   .Where(f => f.Id == flashcardId
            && f.UserId == userId
            && f.Status != FlashcardStatus.Deleted)

   // GetByUserIdAsync (List)
   .Where(f => f.UserId == userId
            && f.Status != FlashcardStatus.Deleted)

   // GetDueFlashcardsAsync (Learning)
   .Where(f => f.UserId == userId
            && f.Status != FlashcardStatus.Deleted
            && f.SRSNextRepetitionDate <= DateTime.UtcNow)
   ```

### Step 6: Add Unit Tests

1. Create `Application.Tests/Commands/DeleteFlashcardCommandHandlerTests.cs`
2. Test scenarios:
   - Successfully soft deletes flashcard (sets Status to Deleted)
   - Updates UpdatedAtUtc timestamp
   - Throws NotFoundException when flashcard doesn't exist
   - Throws NotFoundException when flashcard is already deleted
   - Throws NotFoundException when flashcard belongs to different user
   - Preserves all other flashcard properties (Question, Answer, SRS)
   - Returns Unit.Value on success

### Step 7: Add Validator Tests

1. Create `Application.Tests/Commands/DeleteFlashcardCommandValidatorTests.cs`
2. Test scenarios:
   - Validates FlashcardId greater than 0
   - Validates UserId greater than 0
   - Validates FlashcardId = 0 returns error
   - Validates negative FlashcardId returns error

### Step 8: Add Integration Tests

1. Create or update `Api.Tests/Controllers/FlashcardsControllerTests.cs`
2. Test scenarios:
   - DELETE /api/flashcards/{id} returns 204 No Content
   - Returns 401 when not authenticated
   - Returns 404 when flashcard doesn't exist
   - Returns 404 when accessing another user's flashcard
   - Returns 404 when flashcard is already deleted
   - Deleted flashcard is not returned by GET /api/flashcards
   - Deleted flashcard is not returned by GET /api/flashcards/{id}
   - Deleted flashcard cannot be updated (returns 404)
   - Deleted flashcard cannot be deleted again (returns 404)

### Step 9: Update Swagger Documentation

1. Add XML comments to controller action:
   ```csharp
   /// <summary>
   /// Soft deletes a flashcard (sets Status to Deleted)
   /// </summary>
   /// <param name="id">Flashcard identifier</param>
   /// <returns>No content on success</returns>
   /// <response code="204">Flashcard successfully deleted</response>
   /// <response code="401">Unauthorized - invalid or missing token</response>
   /// <response code="403">Forbidden - flashcard belongs to another user</response>
   /// <response code="404">Not found - flashcard doesn't exist or is already deleted</response>
   ```
2. Document soft delete behavior in API documentation

### Step 10: Add Logging

1. Add structured logging in handler (already in Step 1)
2. Add logging for not found cases:
   ```csharp
   _logger.LogWarning(
       "Attempted to delete non-existent flashcard {FlashcardId} by user {UserId}",
       request.FlashcardId, request.UserId);
   ```
3. Add audit logging for compliance:
   ```csharp
   _logger.LogInformation(
       "User {UserId} soft deleted flashcard {FlashcardId} with question '{QuestionPreview}'",
       request.UserId, request.FlashcardId, flashcard.Question[..Math.Min(50, flashcard.Question.Length)]);
   ```

### Step 11: Consider Hard Delete Endpoint (Future)

1. **Not in MVP:** Physical deletion endpoint
2. **Potential Implementation:** Separate admin endpoint for hard delete
3. **Use Case:** Data cleanup, GDPR compliance (right to be forgotten)
4. **Implementation:**
   ```csharp
   [HttpDelete("{id}/permanent")]
   [Authorize(Roles = "Admin")]
   public async Task<IActionResult> HardDeleteFlashcard(int id)
   {
       // Physical deletion from database
       await _flashcardRepository.DeleteAsync(id);
       await _unitOfWork.SaveChangesAsync();
       return NoContent();
   }
   ```

### Step 12: Test and Validate

1. Manual testing with Swagger UI or Postman
2. Delete flashcard with valid ID
3. Verify 204 No Content response
4. Verify flashcard not returned by GET /api/flashcards
5. Verify flashcard not returned by GET /api/flashcards/{id} (404)
6. Try to delete again (should return 404)
7. Try to update deleted flashcard (should return 404)
8. Test with non-existent flashcard (should return 404)
9. Test with another user's flashcard (should return 404)
10. Check database to verify Status changed to 3 (Deleted)
11. Verify UpdatedAtUtc is updated
12. Verify all other fields are preserved

### Step 13: Performance Testing

1. Measure deletion time under load
2. Verify index usage with SQL execution plan
3. Monitor deleted flashcards accumulation
4. Plan for future archival/cleanup strategy
