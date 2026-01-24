# API Endpoint Implementation Plan: Get Generation Acceptance Rate

## 1. Endpoint Overview

This endpoint retrieves global AI flashcard generation acceptance metrics aggregated across all system users. It calculates various acceptance rates to track the success of the AI-powered flashcard generation feature, specifically measuring whether the system meets the PRD success metric of 75% pure acceptance rate (flashcards accepted without editing).

The endpoint serves as a key performance indicator (KPI) dashboard for monitoring AI generation quality and user satisfaction with generated flashcards.

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/statistics/generation-acceptance`
- **Authentication:** Required (Bearer JWT token)
- **Parameters:**
  - **Required:** None
  - **Optional:** None
- **Request Body:** None (GET request)

## 3. Used Types

### DTOs

- **GenerationAcceptanceResponseDto** (`10xdevs.Application.DTOs.Statistics`)
  ```csharp
  public class GenerationAcceptanceResponseDto
  {
      public int TotalCandidates { get; set; }
      public int AcceptedWithoutEditing { get; set; }
      public int AcceptedAfterEditing { get; set; }
      public int Rejected { get; set; }
      public decimal AcceptanceRate { get; set; }
      public decimal PureAcceptanceRate { get; set; }
      public bool MeetsSuccessMetric { get; set; }
      public decimal TargetRate { get; set; }
  }
  ```

### Query Model (CQRS)

- **GetGenerationAcceptanceQuery** (to be created in `10xdevs.Application.Queries.Statistics.GetGenerationAcceptance`)
  ```csharp
  public class GetGenerationAcceptanceQuery : IRequest<GenerationAcceptanceResponseDto>
  {
      // No parameters needed - aggregates all system data
  }
  ```

### Query Handler

- **GetGenerationAcceptanceQueryHandler** (to be created in same folder)
  ```csharp
  public class GetGenerationAcceptanceQueryHandler :
      IRequestHandler<GetGenerationAcceptanceQuery, GenerationAcceptanceResponseDto>
  {
      // Handler implementation
  }
  ```

### Domain Entities

- **FlashcardGenerationEvent** (`10xdevs.Domain.Entities`) - already exists

### Repository Interface

- **IFlashcardGenerationEventRepository** (`10xdevs.Domain.Interfaces`) - needs extension with aggregation method:
  ```csharp
  Task<(int TotalCandidates, int AcceptedCount, int EditedCount)> GetGlobalStatisticsAsync(
      CancellationToken cancellationToken = default);
  ```

## 4. Response Details

### Success Response (200 OK)

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

**Response Field Definitions:**

- `totalCandidates`: Sum of all `CandidatesCount` from `FlashcardGenerationEvents` table
- `acceptedWithoutEditing`: Sum of all `AcceptedCount` from `FlashcardGenerationEvents` table
- `acceptedAfterEditing`: Sum of all `EditedCount` from `FlashcardGenerationEvents` table
- `rejected`: `totalCandidates - acceptedWithoutEditing - acceptedAfterEditing`
- `acceptanceRate`: `(acceptedWithoutEditing + acceptedAfterEditing) / totalCandidates`
- `pureAcceptanceRate`: `acceptedWithoutEditing / totalCandidates` (primary PRD metric)
- `meetsSuccessMetric`: `pureAcceptanceRate >= 0.75`
- `targetRate`: Constant value `0.75` (75%)

### Error Responses

**401 Unauthorized**

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Missing or invalid authentication token"
}
```

**500 Internal Server Error**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An error occurred while processing your request"
}
```

## 5. Data Flow

### Request Flow

1. **API Layer** (`StatisticsController`)

   - Receives authenticated GET request
   - Extracts user identity from JWT token (for authentication only, not used in query)
   - Creates `GetGenerationAcceptanceQuery`
   - Sends query to MediatR

2. **Application Layer** (`GetGenerationAcceptanceQueryHandler`)

   - Receives query from MediatR pipeline
   - Calls repository method to fetch aggregated statistics
   - Performs calculations:
     - Calculate `rejected` count
     - Calculate `acceptanceRate`
     - Calculate `pureAcceptanceRate`
     - Determine `meetsSuccessMetric` flag
   - Maps results to `GenerationAcceptanceResponseDto`
   - Returns DTO to controller

3. **Infrastructure Layer** (`FlashcardGenerationEventRepository`)

   - Executes efficient SQL aggregation query on `FlashcardGenerationEvents` table:
     ```sql
     SELECT
         SUM(CandidatesCount) AS TotalCandidates,
         SUM(AcceptedCount) AS AcceptedWithoutEditing,
         SUM(EditedCount) AS AcceptedAfterEditing
     FROM FlashcardGenerationEvents
     ```
   - Returns aggregated tuple to handler

4. **API Layer** (Response)
   - Returns 200 OK with `GenerationAcceptanceResponseDto` JSON

### Database Query

The repository method will execute a single, efficient aggregation query:

```csharp
public async Task<(int TotalCandidates, int AcceptedCount, int EditedCount)>
    GetGlobalStatisticsAsync(CancellationToken cancellationToken = default)
{
    var stats = await _context.FlashcardGenerationEvents
        .AsNoTracking()
        .Select(e => new
        {
            e.CandidatesCount,
            e.AcceptedCount,
            e.EditedCount
        })
        .ToListAsync(cancellationToken);

    return (
        TotalCandidates: stats.Sum(s => s.CandidatesCount),
        AcceptedCount: stats.Sum(s => s.AcceptedCount),
        EditedCount: stats.Sum(s => s.EditedCount)
    );
}
```

## 6. Security Considerations

### Authentication

- **Bearer JWT Token Required**: All requests must include a valid JWT token in the Authorization header
- **Token Validation**: Automatically handled by ASP.NET Core authentication middleware
- **Endpoint Decoration**: Apply `[Authorize]` attribute to controller action
- **Token Extraction**: Not used for data filtering (global statistics), but required to verify user is authenticated

### Authorization

- **No Authorization Rules**: Any authenticated user can view global statistics
- **No User-Specific Filtering**: Endpoint returns system-wide aggregated data
- **Rationale**: Statistics are global metrics useful for all users to understand system quality

### Data Security

- **No Sensitive Data Exposure**: Response contains only aggregated metrics, no user-specific information
- **No PII (Personally Identifiable Information)**: Statistics are anonymous
- **Read-Only Operation**: No data mutation, minimal security risk

### Input Validation

- **No Input Parameters**: GET request with no query parameters
- **Authentication Token Validation**: Only validation needed, handled by middleware

## 7. Error Handling

### Potential Error Scenarios

| Error Scenario                 | HTTP Status               | Handling Strategy                                                                        |
| ------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------- |
| Missing authentication token   | 401 Unauthorized          | Automatically handled by `[Authorize]` attribute and authentication middleware           |
| Invalid/expired JWT token      | 401 Unauthorized          | Automatically handled by JWT validation middleware                                       |
| Database connection failure    | 500 Internal Server Error | Caught by global exception handler, logged with correlation ID                           |
| Empty database (no events)     | 200 OK                    | Return valid response with all metrics as 0, rates as 0.0, `meetsSuccessMetric` as false |
| Database timeout               | 500 Internal Server Error | Caught by global exception handler, consider implementing retry policy                   |
| Unhandled exception in handler | 500 Internal Server Error | Caught by global exception handler, logged with full stack trace                         |

### Error Handling Implementation

1. **Global Exception Handler**: Use existing middleware (should already be configured in `Program.cs`)
2. **Structured Logging**: Log all errors with correlation ID for request tracking
3. **ProblemDetails Response**: Return standardized error responses using RFC 7807 format
4. **Zero Data Handling**: When no generation events exist, return valid response with zero values

### Handler Error Handling Example

```csharp
public async Task<GenerationAcceptanceResponseDto> Handle(
    GetGenerationAcceptanceQuery request,
    CancellationToken cancellationToken)
{
    try
    {
        var (totalCandidates, acceptedCount, editedCount) =
            await _repository.GetGlobalStatisticsAsync(cancellationToken);

        // Handle case where no data exists
        if (totalCandidates == 0)
        {
            return new GenerationAcceptanceResponseDto
            {
                TotalCandidates = 0,
                AcceptedWithoutEditing = 0,
                AcceptedAfterEditing = 0,
                Rejected = 0,
                AcceptanceRate = 0.0m,
                PureAcceptanceRate = 0.0m,
                MeetsSuccessMetric = false,
                TargetRate = 0.75m
            };
        }

        // Calculate derived metrics
        var rejected = totalCandidates - acceptedCount - editedCount;
        var acceptanceRate = (decimal)(acceptedCount + editedCount) / totalCandidates;
        var pureAcceptanceRate = (decimal)acceptedCount / totalCandidates;

        return new GenerationAcceptanceResponseDto
        {
            TotalCandidates = totalCandidates,
            AcceptedWithoutEditing = acceptedCount,
            AcceptedAfterEditing = editedCount,
            Rejected = rejected,
            AcceptanceRate = Math.Round(acceptanceRate, 3),
            PureAcceptanceRate = Math.Round(pureAcceptanceRate, 3),
            MeetsSuccessMetric = pureAcceptanceRate >= 0.75m,
            TargetRate = 0.75m
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving generation acceptance statistics");
        throw; // Re-throw to be handled by global exception handler
    }
}
```

## 8. Implementation Steps

### Phase 1: Domain & Infrastructure Layer

1. **Extend IFlashcardGenerationEventRepository interface**

   - File: `backend/src/10xdevs.Domain/Interfaces/IFlashcardGenerationEventRepository.cs`
   - Add method signature: `Task<(int TotalCandidates, int AcceptedCount, int EditedCount)> GetGlobalStatisticsAsync(CancellationToken cancellationToken = default);`

2. **Implement repository method**
   - File: `backend/src/10xdevs.Infrastructure/Repositories/FlashcardGenerationEventRepository.cs`
   - Implement `GetGlobalStatisticsAsync` method with efficient EF Core aggregation query
   - Use `.AsNoTracking()` for read-only performance
   - Handle empty table scenario gracefully

### Phase 2: Application Layer (CQRS Query)

3. **Create Query model**

   - Directory: `backend/src/10xdevs.Application/Queries/Statistics/GetGenerationAcceptance/`
   - File: `GetGenerationAcceptanceQuery.cs`
   - Define empty query class implementing `IRequest<GenerationAcceptanceResponseDto>`

4. **Create Query handler**

   - File: `GetGenerationAcceptanceQueryHandler.cs`
   - Inject `IFlashcardGenerationEventRepository` and `ILogger<GetGenerationAcceptanceQueryHandler>`
   - Implement `Handle` method:
     - Call repository `GetGlobalStatisticsAsync` method
     - Handle zero data scenario (return valid response with zeros)
     - Calculate derived metrics: `rejected`, `acceptanceRate`, `pureAcceptanceRate`
     - Round decimal values to 3 decimal places
     - Set `meetsSuccessMetric` based on `pureAcceptanceRate >= 0.75m`
     - Set `targetRate` constant to `0.75m`
     - Return `GenerationAcceptanceResponseDto`
   - Add comprehensive error handling and logging

5. **Verify DTO exists**
   - File: `backend/src/10xdevs.Application/DTOs/Statistics/GenerationAcceptanceResponseDto.cs`
   - Already created, no changes needed

### Phase 3: API Layer (Controller)

6. **Create StatisticsController**

   - Directory: `backend/src/10xdevs.Api/Controllers/`
   - File: `StatisticsController.cs`
   - Add controller attributes: `[ApiController]`, `[Route("api/statistics")]`, `[Authorize]`
   - Inject `IMediator` and `ILogger<StatisticsController>`

7. **Implement GET endpoint action**
   - Method: `GetGenerationAcceptance`
   - HTTP Method: `[HttpGet("generation-acceptance")]`
   - Add `[Authorize]` attribute for authentication requirement
   - Add XML documentation comments (summary, response codes)
   - Add `[ProducesResponseType]` attributes:
     - `200 OK` with `GenerationAcceptanceResponseDto`
     - `401 Unauthorized` with `ProblemDetails`
     - `500 Internal Server Error` with `ProblemDetails`
   - Accept `CancellationToken` parameter
   - Create `GetGenerationAcceptanceQuery` instance
   - Send query via MediatR
   - Return `Ok(response)`

### Phase 4: Optimization (Optional but Recommended)

8. **Implement response caching**

   - Add `[ResponseCache(Duration = 300)]` attribute to controller action (5 minutes)
   - OR implement in-memory caching in query handler using `IMemoryCache`
   - Configure cache settings in `Program.cs` if using response caching

9. **Add performance monitoring**
   - Log query execution time in handler
   - Add custom metrics for monitoring dashboard (if available)

### Phase 5: Testing & Documentation

12. **Update Swagger/OpenAPI documentation**

    - Verify XML comments generate proper Swagger documentation
    - Test endpoint via Swagger UI
    - Confirm response examples match specification

13. **Manual testing**
    - Test with Postman/Thunder Client
    - Verify authentication token requirement
    - Test with empty database
    - Test with populated database
    - Verify calculation accuracy
    - Check response format and status codes

## 10. Additional Notes

### Constants

Consider extracting the target rate constant to configuration:

```csharp
// appsettings.json
{
  "Statistics": {
    "GenerationAcceptanceTargetRate": 0.75
  }
}

// Configuration class
public class StatisticsOptions
{
    public decimal GenerationAcceptanceTargetRate { get; set; } = 0.75m;
}
```

### Dependencies

Ensure the following NuGet packages are installed:

- `MediatR` (already used in project)
- `Microsoft.EntityFrameworkCore` (already used)
- `Microsoft.AspNetCore.Authentication.JwtBearer` (for JWT authentication)
- `Microsoft.Extensions.Caching.Memory` (for optional in-memory caching)
