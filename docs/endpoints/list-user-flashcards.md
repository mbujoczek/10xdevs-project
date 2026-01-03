# API Endpoint Implementation Plan: List User Flashcards

## 1. Endpoint Overview

This endpoint retrieves all active (non-deleted) flashcards belonging to the authenticated user. It supports optional filtering by status and source to enable users to view specific subsets of their flashcard collection. This is a read-only operation that returns a paginated or complete list of flashcards with their full metadata including SRS algorithm parameters.

**Business Purpose:**

- Allow users to browse their entire flashcard collection
- Enable filtering by flashcard origin (AI-generated vs manually created)
- Support filtering by acceptance status (Accepted, Edited)
- Provide foundation for flashcard management UI

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Pattern:** `/api/flashcards`
- **Authentication:** Required (JWT Bearer token)
- **Authorization:** User can only access their own flashcards

### Query Parameters

**Optional Parameters:**

- `status` (integer, optional, repeatable)
  - **Description:** Filter by flashcard status
  - **Allowed Values:** `0` (Not Applicable), `1` (Accepted), `2` (Edited)
  - **Multiple Values:** Supported (e.g., `?status=0&status=1&status=2`)
  - **Default:** No filtering (returns all active flashcards)
  - **Validation:** Must be 0, 1, or 2 if provided
- `source` (integer, optional)
  - **Description:** Filter by flashcard source
  - **Allowed Values:** `0` (AI-generated), `1` (Manual)
  - **Default:** No filtering (returns both AI and manual flashcards)
  - **Validation:** Must be 0 or 1 if provided

**Request Headers:**

```
Authorization: Bearer {jwt_token}
```

**Example Requests:**

```
GET /api/flashcards
GET /api/flashcards?status=1
GET /api/flashcards?status=1&status=2
GET /api/flashcards?source=0
GET /api/flashcards?source=1&status=2
```

## 3. Types Used

### Query Model

```csharp
// Application/Queries/Flashcards/GetUserFlashcards/GetUserFlashcardsQuery.cs
public class GetUserFlashcardsQuery : IRequest<ListFlashcardsResponseDto>
{
    public int UserId { get; set; }
    public List<FlashcardStatus>? StatusFilter { get; set; }
    public FlashcardSource? SourceFilter { get; set; }
}
```

### Response DTO (Existing)

```csharp
// Application/DTOs/Flashcards/ListFlashcardsResponseDto.cs
public class ListFlashcardsResponseDto
{
    public List<FlashcardDto> Flashcards { get; set; } = [];
    public int TotalCount { get; set; }
}
```

### Flashcard DTO (Existing)

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

**Headers:**

```
Content-Type: application/json
```

### Error Responses

#### 400 Bad Request

**Scenario:** Invalid query parameter values

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "status": [
      "Status must be 0 (Not Applicable), 1 (Accepted), or 2 (Edited)"
    ],
    "source": ["Source must be 0 (AI) or 1 (Manual)"]
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

### Query Handler Flow

```
1. Controller receives GET request with optional query parameters
2. Extract UserId from JWT claims (ClaimsPrincipal)
3. Parse and validate query parameters (status, source)
4. Create GetUserFlashcardsQuery with UserId and filters
5. Send query to MediatR
6. Handler receives query
7. Call Repository method to fetch flashcards with filters
8. Repository builds LINQ query:
   - WHERE UserId = {userId}
   - AND Status != Deleted (3)
   - AND Status IN {statusFilter} (if provided)
   - AND Source = {sourceFilter} (if provided)
   - ORDER BY CreatedAtUtc DESC
9. Execute query and load flashcards
10. Map domain entities to FlashcardDto using AutoMapper
11. Create ListFlashcardsResponseDto with flashcards and count
12. Return response to controller
13. Controller returns 200 OK with response body
```

### Database Query

```sql
SELECT
    Id, UserId, Question, Answer, Source, Status,
    SRSInterval, SRSRepetitions, SRSEaseFactor,
    SRSNextRepetitionDate, SRSLastGrade,
    CreatedAtUtc, UpdatedAtUtc
FROM Flashcards
WHERE UserId = @userId
    AND Status != 3  -- Exclude deleted flashcards
    AND (@statusFilter IS NULL OR Status IN (@statusFilter))
    AND (@sourceFilter IS NULL OR Source = @sourceFilter)
ORDER BY CreatedAtUtc DESC
```

**Index Usage:**

- Primary filter uses `IX_Flashcards_UserId_Status` composite index
- Efficiently filters by user and excludes deleted items
- Additional filters applied in memory or via index scan

## 6. Security Considerations

### Authentication

- **JWT Validation:** Endpoint requires valid Bearer token in Authorization header
- **Token Expiration:** Server validates token hasn't expired (12-hour validity)
- **Token Signature:** Server validates HMAC-SHA256 signature using secret key

### Authorization

- **User Data Isolation:** UserId extracted from JWT `sub` claim, never from request
- **No Cross-User Access:** Query automatically filtered by authenticated UserId
- **Claim Validation:** Verify `sub` claim exists and contains valid integer UserId

### Data Security

- **Soft Delete Protection:** Query excludes Status=Deleted (3) flashcards
- **No Sensitive Data:** Response contains only user's own flashcard data
- **Read-Only Operation:** No state mutation, safe from injection attacks

### Input Validation

- **Query Parameter Sanitization:** Validate status and source are valid enum values
- **Type Safety:** Use strongly-typed enum parsing (FlashcardStatus, FlashcardSource)
- **SQL Injection Protection:** Use parameterized queries via Entity Framework

## 7. Error Handling

### Validation Errors (400)

**Scenario 1:** Invalid status value

```csharp
if (status != 0 && status != 1 && status != 2)
    return BadRequest("Status must be 0 (Not Applicable), 1 (Accepted), or 2 (Edited)");
```

**Scenario 2:** Invalid source value

```csharp
if (source != 0 && source != 1)
    return BadRequest("Source must be 0 (AI) or 1 (Manual)");
```

### Authentication Errors (401)

**Scenario 1:** Invalid or expired token

```csharp
// Handled automatically by [Authorize] attribute
// Returns 401 Unauthorized with standard problem details
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
    _logger.LogError(ex, "Failed to retrieve flashcards for user {UserId}", userId);
    return StatusCode(500, "An error occurred while retrieving flashcards");
}
```

**Logging:** Use structured logging with Serilog to capture:

- UserId
- Filter parameters
- Exception details
- Request correlation ID

## 9. Implementation Steps

### Step 1: Create Query and Handler

1. Create `Application/Queries/Flashcards/GetUserFlashcards/` folder
2. Create `GetUserFlashcardsQuery.cs`:
   ```csharp
   public class GetUserFlashcardsQuery : IRequest<ListFlashcardsResponseDto>
   {
       public int UserId { get; set; }
       public List<FlashcardStatus>? StatusFilter { get; set; }
       public FlashcardSource? SourceFilter { get; set; }
   }
   ```
3. Create `GetUserFlashcardsQueryHandler.cs`:

   ```csharp
   public class GetUserFlashcardsQueryHandler
       : IRequestHandler<GetUserFlashcardsQuery, ListFlashcardsResponseDto>
   {
       private readonly IFlashcardRepository _flashcardRepository;
       private readonly IMapper _mapper;

       public async Task<ListFlashcardsResponseDto> Handle(
           GetUserFlashcardsQuery request,
           CancellationToken cancellationToken)
       {
           // Implementation
       }
   }
   ```

### Step 2: Add Repository Methods

1. Update `Domain/Interfaces/IFlashcardRepository.cs`:
   ```csharp
   Task<List<Flashcard>> GetByUserIdAsync(
       int userId,
       List<FlashcardStatus>? statusFilter = null,
       FlashcardSource? sourceFilter = null,
       CancellationToken cancellationToken = default);
   ```
2. Implement in `Infrastructure/Repositories/FlashcardRepository.cs`:
   - Build filtered query using LINQ
   - Exclude deleted flashcards (Status != Deleted)
   - Apply status filter if provided
   - Apply source filter if provided
   - Order by CreatedAtUtc descending
   - Execute async and return list

### Step 3: Configure AutoMapper

1. Update or create `Application/Mappings/FlashcardMappingProfile.cs`:
   ```csharp
   CreateMap<Flashcard, FlashcardDto>();
   ```

### Step 4: Create Controller Endpoint

1. Update `Api/Controllers/FlashcardsController.cs`:

   ```csharp
   [HttpGet]
   [Authorize]
   public async Task<ActionResult<ListFlashcardsResponseDto>> GetFlashcards(
       [FromQuery] List<int>? status,
       [FromQuery] int? source,
       CancellationToken cancellationToken)
   {
       var userId = User.GetUserId();

       // Validate and parse parameters
       // Create query
       // Send via MediatR
       // Return response
   }
   ```

### Step 5: Add Query Parameter Validation

1. Validate status values (if provided):
   - Check each value is 0, 1, or 2
   - Return 400 Bad Request if invalid
2. Validate source value (if provided):
   - Check value is 0 or 1
   - Return 400 Bad Request if invalid
3. Convert integers to enum values safely

### Step 8: Update Swagger Documentation

1. Add XML comments to controller action:
   ```csharp
   /// <summary>
   /// Retrieves all active flashcards for the authenticated user
   /// </summary>
   /// <param name="status">Filter by status (0=Not Applicable, 1=Accepted, 2=Edited). Can specify multiple.</param>
   /// <param name="source">Filter by source (0=AI, 1=Manual)</param>
   /// <returns>List of flashcards with metadata</returns>
   ```
2. Add response examples using Swashbuckle attributes

### Step 9: Add Logging

1. Add structured logging in handler:
   ```csharp
   _logger.LogInformation(
       "Retrieving flashcards for user {UserId} with status filter {StatusFilter} and source filter {SourceFilter}",
       request.UserId, request.StatusFilter, request.SourceFilter);
   ```

### Step 10: Test and Validate

1. Manual testing with Swagger UI or Postman
2. Verify response structure matches API specification
3. Test all filter combinations
4. Verify authentication and authorization
5. Check query performance with sample data
6. Validate error responses match specification
