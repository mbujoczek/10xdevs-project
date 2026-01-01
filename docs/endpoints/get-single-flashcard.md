# API Endpoint Implementation Plan: Get Single Flashcard

## 1. Endpoint Overview

This endpoint retrieves detailed information about a single flashcard by its unique identifier. It returns complete flashcard metadata including all SRS algorithm parameters. The endpoint ensures user data isolation by verifying that the requested flashcard belongs to the authenticated user. Deleted flashcards are not accessible through this endpoint.

**Business Purpose:**

- Allow users to view full details of a specific flashcard
- Support flashcard detail view in the UI
- Enable retrieval of SRS parameters for learning session context
- Provide foundation for edit and review operations

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Pattern:** `/api/flashcards/{id}`
- **Authentication:** Required (JWT Bearer token)
- **Authorization:** User can only access their own flashcards

### Path Parameters

**Required Parameters:**

- `id` (integer, required)
  - **Description:** Unique flashcard identifier
  - **Constraints:** Must be positive integer
  - **Example:** `/api/flashcards/101`

**Request Headers:**

```
Authorization: Bearer {jwt_token}
```

**Example Requests:**

```
GET /api/flashcards/101
GET /api/flashcards/52
```

## 3. Types Used

### Query Model

```csharp
// Application/Queries/Flashcards/GetFlashcardById/GetFlashcardByIdQuery.cs
public class GetFlashcardByIdQuery : IRequest<FlashcardDto>
{
    public int FlashcardId { get; set; }
    public int UserId { get; set; }
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

## 4. Response Details

### Success Response (200 OK)

**Body:**

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

**Headers:**

```
Content-Type: application/json
```

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
  "detail": "You do not have permission to access this flashcard."
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
  "detail": "Flashcard with ID 101 was not found."
}
```

## 5. Data Flow

### Query Handler Flow

```
1. Controller receives GET request with flashcard ID in route
2. Extract UserId from JWT claims (ClaimsPrincipal)
3. Validate flashcard ID is positive integer
4. Create GetFlashcardByIdQuery with FlashcardId and UserId
5. Send query to MediatR
6. Handler receives query
7. Call Repository method to fetch flashcard by ID
8. Repository executes query:
   - WHERE Id = {flashcardId}
   - AND UserId = {userId}
   - AND Status != Deleted (3)
9. Check if flashcard exists:
   - If null, throw NotFoundException
10. Verify ownership (redundant check, query already filtered):
   - If flashcard.UserId != request.UserId, throw ForbiddenException
11. Map domain entity to FlashcardDto using AutoMapper
12. Return FlashcardDto to controller
13. Controller returns 200 OK with response body
```

### Database Query

```sql
SELECT TOP 1
    Id, UserId, Question, Answer, Source, Status,
    SRSInterval, SRSRepetitions, SRSEaseFactor,
    SRSNextRepetitionDate, SRSLastGrade,
    CreatedAtUtc, UpdatedAtUtc
FROM Flashcards
WHERE Id = @flashcardId
    AND UserId = @userId
    AND Status != 3  -- Exclude deleted flashcards
```

**Index Usage:**

- Primary key lookup on `Id` (clustered index `PK_Flashcards`)
- Very fast: O(log n) complexity
- Additional UserId filter applied efficiently

## 6. Security Considerations

### Authentication

- **JWT Validation:** Endpoint requires valid Bearer token in Authorization header
- **Token Expiration:** Server validates token hasn't expired (12-hour validity)
- **Token Signature:** Server validates HMAC-SHA256 signature using secret key

### Authorization

- **User Data Isolation:** UserId extracted from JWT `sub` claim, never from request
- **Ownership Verification:** Query filters by both FlashcardId AND UserId
- **Cross-User Prevention:** Attempting to access another user's flashcard returns 403 Forbidden
- **Claim Validation:** Verify `sub` claim exists and contains valid integer UserId

### Data Security

- **Soft Delete Protection:** Query excludes Status=Deleted (3) flashcards
- **No Sensitive Data Exposure:** Response contains only user's own flashcard data
- **Read-Only Operation:** No state mutation, safe from injection attacks
- **Minimal Data Exposure:** Returns only necessary flashcard information

### Input Validation

- **ID Validation:** Verify flashcard ID is valid positive integer
- **SQL Injection Protection:** Use parameterized queries via Entity Framework
- **Path Traversal Prevention:** ID is integer, no file system access risk

### Privacy Considerations

- **404 vs 403 Response:** Return 404 for both non-existent and unauthorized access to prevent user enumeration
- **Error Message Sanitization:** Don't reveal whether flashcard exists if user doesn't own it

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

**Scenario 3:** Missing UserId claim

```csharp
var userId = User.GetUserId(); // ClaimsPrincipal extension
if (userId == null)
    return Unauthorized("Invalid token claims");
```

### Authorization Errors (403)

**Scenario:** Flashcard belongs to different user

```csharp
// Option 1: Return 404 to prevent user enumeration (RECOMMENDED)
if (flashcard == null || flashcard.UserId != userId)
    throw new NotFoundException($"Flashcard with ID {flashcardId} was not found.");

// Option 2: Return explicit 403 (less secure)
if (flashcard.UserId != userId)
    throw new ForbiddenException("You do not have permission to access this flashcard.");
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

### System Errors (500)

**Scenario:** Database connection failure, unexpected exceptions

```csharp
try
{
    // Query execution
}
catch (Exception ex)
{
    _logger.LogError(ex,
        "Failed to retrieve flashcard {FlashcardId} for user {UserId}",
        flashcardId, userId);
    return StatusCode(500, "An error occurred while retrieving the flashcard");
}
```

**Custom Exceptions:**

```csharp
// Application/Exceptions/NotFoundException.cs
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

// Application/Exceptions/ForbiddenException.cs
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}
```

**Exception Handling Middleware:**

- Catch custom exceptions in `GlobalExceptionHandlerMiddleware`
- Map to appropriate HTTP status codes
- Return consistent ProblemDetails response

## 8. Performance Considerations

### Database Optimization

- **Primary Key Lookup:** Extremely fast using clustered index
- **Query Execution Time:** ~1-2ms average
- **Single Record Retrieval:** No joins, minimal overhead
- **Index Usage:** Leverages clustered primary key index

### Caching Strategy

- **Response Caching:** Consider caching individual flashcard responses
- **Cache Key:** `flashcard:{flashcardId}:user:{userId}`
- **Cache TTL:** 5-10 minutes
- **Cache Invalidation:** Invalidate on flashcard update or delete
- **ETag Support:** Return ETag header based on UpdatedAtUtc

### Query Performance

- **Expected Response Time:** <5ms
- **Memory Usage:** ~1-2KB per response
- **Connection Pooling:** Use default EF Core connection pooling
- **No N+1 Queries:** Single query retrieves all data

### Monitoring

- **Metrics to Track:**
  - Average response time
  - 95th percentile response time
  - 404 rate (indicates invalid ID usage)
  - 403 rate (indicates authorization issues)
  - Cache hit rate (if caching implemented)

## 9. Implementation Steps

### Step 1: Create Query and Handler

1. Create `Application/Queries/Flashcards/GetFlashcardById/` folder
2. Create `GetFlashcardByIdQuery.cs`:
   ```csharp
   public class GetFlashcardByIdQuery : IRequest<FlashcardDto>
   {
       public int FlashcardId { get; set; }
       public int UserId { get; set; }
   }
   ```
3. Create `GetFlashcardByIdQueryHandler.cs`:
   ```csharp
   public class GetFlashcardByIdQueryHandler
       : IRequestHandler<GetFlashcardByIdQuery, FlashcardDto>
   {
       private readonly IFlashcardRepository _flashcardRepository;
       private readonly IMapper _mapper;
       private readonly ILogger<GetFlashcardByIdQueryHandler> _logger;

       public async Task<FlashcardDto> Handle(
           GetFlashcardByIdQuery request,
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

           return _mapper.Map<FlashcardDto>(flashcard);
       }
   }
   ```

### Step 2: Create Custom Exceptions

1. Create `Application/Exceptions/NotFoundException.cs`:
   ```csharp
   public class NotFoundException : Exception
   {
       public NotFoundException(string message) : base(message) { }
   }
   ```
2. Create `Application/Exceptions/ForbiddenException.cs`:
   ```csharp
   public class ForbiddenException : Exception
   {
       public ForbiddenException(string message) : base(message) { }
   }
   ```

### Step 3: Add Repository Methods

1. Update `Domain/Interfaces/IFlashcardRepository.cs`:
   ```csharp
   Task<Flashcard?> GetByIdAsync(
       int flashcardId,
       int userId,
       CancellationToken cancellationToken = default);
   ```
2. Implement in `Infrastructure/Repositories/FlashcardRepository.cs`:
   ```csharp
   public async Task<Flashcard?> GetByIdAsync(
       int flashcardId,
       int userId,
       CancellationToken cancellationToken = default)
   {
       return await _context.Flashcards
           .Where(f => f.Id == flashcardId
                    && f.UserId == userId
                    && f.Status != FlashcardStatus.Deleted)
           .FirstOrDefaultAsync(cancellationToken);
   }
   ```

### Step 4: Update Exception Middleware

1. Update `Api/Middleware/GlobalExceptionHandlerMiddleware.cs`:
   ```csharp
   catch (NotFoundException ex)
   {
       context.Response.StatusCode = StatusCodes.Status404NotFound;
       await context.Response.WriteAsJsonAsync(new ProblemDetails
       {
           Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
           Title = "Not Found",
           Status = 404,
           Detail = ex.Message
       });
   }
   catch (ForbiddenException ex)
   {
       context.Response.StatusCode = StatusCodes.Status403Forbidden;
       await context.Response.WriteAsJsonAsync(new ProblemDetails
       {
           Type = "https://tools.ietf.org/html/rfc7231#section-6.5.3",
           Title = "Forbidden",
           Status = 403,
           Detail = ex.Message
       });
   }
   ```

### Step 5: Create Controller Endpoint

1. Update `Api/Controllers/FlashcardsController.cs`:
   ```csharp
   [HttpGet("{id}")]
   [Authorize]
   public async Task<ActionResult<FlashcardDto>> GetFlashcard(
       int id,
       CancellationToken cancellationToken)
   {
       var userId = User.GetUserId();

       var query = new GetFlashcardByIdQuery
       {
           FlashcardId = id,
           UserId = userId
       };

       var flashcard = await _mediator.Send(query, cancellationToken);

       return Ok(flashcard);
   }
   ```

### Step 6: Configure AutoMapper

1. Mapping already exists from previous endpoint:
   ```csharp
   CreateMap<Flashcard, FlashcardDto>();
   ```

### Step 7: Add Unit Tests

1. Create `Application.Tests/Queries/GetFlashcardByIdQueryHandlerTests.cs`
2. Test scenarios:
   - Returns flashcard when exists and belongs to user
   - Throws NotFoundException when flashcard doesn't exist
   - Throws NotFoundException when flashcard is soft-deleted
   - Throws NotFoundException when flashcard belongs to different user
   - Maps all properties correctly

### Step 8: Add Integration Tests

1. Create or update `Api.Tests/Controllers/FlashcardsControllerTests.cs`
2. Test scenarios:
   - GET /api/flashcards/{id} returns 200 with flashcard details
   - Returns 401 when not authenticated
   - Returns 404 when flashcard doesn't exist
   - Returns 404 when accessing another user's flashcard
   - Returns 404 when flashcard is deleted
   - Returns correct flashcard data structure

### Step 9: Update Swagger Documentation

1. Add XML comments to controller action:
   ```csharp
   /// <summary>
   /// Retrieves a single flashcard by ID
   /// </summary>
   /// <param name="id">Unique flashcard identifier</param>
   /// <returns>Flashcard details with full metadata</returns>
   /// <response code="200">Returns the flashcard details</response>
   /// <response code="401">Unauthorized - invalid or missing token</response>
   /// <response code="403">Forbidden - flashcard belongs to another user</response>
   /// <response code="404">Not found - flashcard doesn't exist or is deleted</response>
   ```
2. Add response examples using Swashbuckle attributes

### Step 10: Add Logging

1. Add structured logging in handler:
   ```csharp
   _logger.LogInformation(
       "Retrieving flashcard {FlashcardId} for user {UserId}",
       request.FlashcardId, request.UserId);
   ```
2. Add logging in exception cases:
   ```csharp
   _logger.LogWarning(
       "Flashcard {FlashcardId} not found for user {UserId}",
       request.FlashcardId, request.UserId);
   ```

### Step 11: Test and Validate

1. Manual testing with Swagger UI or Postman
2. Test with valid flashcard ID
3. Test with non-existent ID (should return 404)
4. Test with another user's flashcard (should return 404)
5. Test with deleted flashcard (should return 404)
6. Verify response structure matches API specification
7. Verify authentication and authorization
8. Check query performance
