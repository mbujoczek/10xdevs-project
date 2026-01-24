# API Endpoint Implementation Plan: Generate Flashcards from Text

## 1. Endpoint Overview

This endpoint enables authenticated users to generate flashcard candidates from input text using an AI model (Ollama). The AI processes the provided text and returns a list of question-answer pairs suitable for learning. The endpoint creates a `FlashcardGenerationEvent` record to track the generation metrics and returns temporary candidate IDs that can be used in the subsequent review/completion process.

**Key Characteristics:**

- AI-powered flashcard generation
- Supports multiple languages (Polish and English)
- Creates audit trail via `FlashcardGenerationEvents` table
- Returns temporary candidates (not persisted as Flashcards until review is completed)
- Requires user authentication

---

## 2. Request Details

### HTTP Method

`POST`

### URL Structure

`/api/flashcards/generate`

### Authentication

- **Type:** Bearer Token (JWT)
- **Location:** Authorization header
- **Format:** `Authorization: Bearer {token}`

### Request Headers

```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

### Request Body Schema

```json
{
  "inputText": "string (required, max 10000 chars)",
  "language": "string (optional, values: 'pl' or 'en', default: 'en')"
}
```

### Parameters

#### Required Parameters:

- **inputText** (string)
  - Description: The text content from which flashcards will be generated
  - Constraints:
    - Required
    - Maximum length: 10,000 characters
    - Must not be empty or whitespace only
  - Validation: `[Required]` and `[MaxLength(10000)]` attributes

#### Optional Parameters:

- **language** (string)
  - Description: The language for generated flashcards
  - Constraints:
    - Optional
    - Allowed values: 'pl' (Polish) or 'en' (English)
    - Default value: 'en'
  - Validation: `[RegularExpression("^(pl|en)$")]` attribute

### Request Example

```json
{
  "inputText": "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing to the language, which can help catch errors early during development.",
  "language": "en"
}
```

---

## 3. Types Used

### DTOs (Data Transfer Objects)

#### GenerateFlashcardsRequestDto

**Location:** `10xdevs.Application/DTOs/Flashcards/GenerateFlashcardsRequestDto.cs`

```csharp
public class GenerateFlashcardsRequestDto
{
    [Required]
    [MaxLength(10000)]
    public string InputText { get; set; } = string.Empty;

    [RegularExpression("^(pl|en)$")]
    public string? Language { get; set; } = "en";
}
```

#### GenerateFlashcardsResponseDto

**Location:** `10xdevs.Application/DTOs/Flashcards/GenerateFlashcardsResponseDto.cs`

```csharp
public class GenerateFlashcardsResponseDto
{
    public int GenerationEventId { get; set; }
    public List<FlashcardCandidateDto> Candidates { get; set; } = [];
    public int CandidatesCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
```

**Note:** There's a typo in the property name `CadidatesCount` - should be `CandidatesCount`. This should be corrected during implementation.

#### FlashcardCandidateDto

**Location:** `10xdevs.Application/DTOs/Flashcards/FlashcardCandidateDto.cs`

```csharp
public class FlashcardCandidateDto
{
    public string CandidateId { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}
```

### Command Model

#### GenerateFlashcardsCommand

**Location:** `10xdevs.Application/Commands/Flashcards/GenerateFlashcards/GenerateFlashcardsCommand.cs` (to be created)

```csharp
public class GenerateFlashcardsCommand : IRequest<GenerateFlashcardsResponseDto>
{
    public int UserId { get; set; }
    public string InputText { get; set; } = string.Empty;
    public string Language { get; set; } = "en";
}
```

#### GenerateFlashcardsCommandHandler

**Location:** `10xdevs.Application/Commands/Flashcards/GenerateFlashcards/GenerateFlashcardsCommandHandler.cs` (to be created)

```csharp
public class GenerateFlashcardsCommandHandler : IRequestHandler<GenerateFlashcardsCommand, GenerateFlashcardsResponseDto>
{
    private readonly IFlashcardAIService _aiService;
    private readonly IFlashcardGenerationEventRepository _eventRepository;

    public async Task<GenerateFlashcardsResponseDto> Handle(
        GenerateFlashcardsCommand request,
        CancellationToken cancellationToken)
    {
        // Implementation
    }
}
```

### Domain Entities

#### FlashcardGenerationEvent

**Location:** `10xdevs.Domain/Entities/FlashcardGenerationEvent.cs` (already exists)

```csharp
public class FlashcardGenerationEvent
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CandidatesCount { get; set; }
    public int AcceptedCount { get; set; }
    public int EditedCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public User User { get; set; } = null!;
}
```

### Service Interfaces

#### IFlashcardAIService

**Location:** `10xdevs.Application/Interfaces/IFlashcardAIService.cs` (to be created)

```csharp
public interface IFlashcardAIService
{
    Task<List<FlashcardCandidateDto>> GenerateFlashcardsAsync(
        string inputText,
        string language,
        CancellationToken cancellationToken = default);
}
```

#### IFlashcardGenerationEventRepository

**Location:** `10xdevs.Domain/Interfaces/IFlashcardGenerationEventRepository.cs` (to be created)

```csharp
public interface IFlashcardGenerationEventRepository
{
    Task<FlashcardGenerationEvent> CreateAsync(
        FlashcardGenerationEvent generationEvent,
        CancellationToken cancellationToken = default);
    Task<FlashcardGenerationEvent?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);
}
```

---

## 4. Response Details

### Success Response (201 Created)

**Status Code:** `201 Created`

**Response Body:**

```json
{
  "generationEventId": 42,
  "candidatesCount": 8,
  "candidates": [
    {
      "candidateId": "temp-1",
      "question": "What is TypeScript?",
      "answer": "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript."
    },
    {
      "candidateId": "temp-2",
      "question": "What does TypeScript add to JavaScript?",
      "answer": "TypeScript adds optional static typing to JavaScript."
    }
  ],
  "createdAtUtc": "2025-12-31T10:00:00Z"
}
```

**Response Headers:**

```
Content-Type: application/json
Location: /api/flashcards/generation/42
```

### Error Responses

#### 400 Bad Request - Validation Error

**Scenario:** Input text exceeds 10,000 characters, is empty, or language is invalid

**Response Body:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "inputText": ["Input text must not exceed 10000 characters"],
    "language": ["Language must be either 'pl' or 'en'"]
  }
}
```

#### 401 Unauthorized - Missing or Invalid Token

**Scenario:** No Bearer token provided or token is invalid/expired

**Response Body:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication token is missing or invalid."
}
```

#### 503 Service Unavailable - AI Service Down

**Scenario:** Ollama service is not reachable or returns an error

**Response Body:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.4",
  "title": "AI service unavailable",
  "status": 503,
  "detail": "The AI flashcard generation service is currently unavailable. Please try again later."
}
```

---

## 5. Data Flow

### High-Level Flow

```
1. Client Request → API Controller
2. Controller → JWT Authentication Middleware (validate token, extract UserId)
3. Controller → Model Validation (validate request DTO)
4. Controller → MediatR → GenerateFlashcardsCommand
5. Command Handler → IFlashcardAIService (call Ollama API)
6. AI Service → Ollama API (send prompt with input text and language)
7. Ollama API → AI Service (return JSON with flashcard candidates)
8. Command Handler → Parse AI response into FlashcardCandidateDto list
9. Command Handler → Generate temporary candidate IDs (e.g., "temp-1", "temp-2")
10. Command Handler → Create FlashcardGenerationEvent entity
11. Command Handler → IFlashcardGenerationEventRepository.CreateAsync()
12. Repository → Database (INSERT into FlashcardGenerationEvents)
13. Repository → Return saved entity with Id
14. Command Handler → Map to GenerateFlashcardsResponseDto
15. Controller → Return 201 Created with response body
```

### Detailed Component Interactions

#### 1. Controller Layer (`FlashcardsController`)

- Receives HTTP POST request
- Validates Bearer token via `[Authorize]` attribute
- Extracts `UserId` from JWT claims
- Validates request body against `GenerateFlashcardsRequestDto` constraints
- Creates `GenerateFlashcardsCommand` with UserId and request data
- Sends command to MediatR
- Returns HTTP 201 with response DTO

#### 2. Application Layer (`GenerateFlashcardsCommandHandler`)

- Receives command from MediatR pipeline
- Calls `IFlashcardAIService.GenerateFlashcardsAsync()` with input text and language
- Handles AI service communication errors (catch exceptions, return 503)
- Generates unique temporary candidate IDs for each flashcard
- Creates `FlashcardGenerationEvent` entity:
  - Sets `UserId` from command
  - Sets `CandidatesCount` from AI response
  - Sets `AcceptedCount` and `EditedCount` to 0 (will be updated during review completion)
  - Sets `CreatedAtUtc` and `UpdatedAtUtc` to current UTC time
- Persists entity via repository
- Maps domain entity and candidates to response DTO
- Returns response DTO

#### 3. Infrastructure Layer (`FlashcardAIService`)

- Constructs prompt for Ollama API based on input text and language
- Sends HTTP request to Ollama endpoint
- Parses JSON response into structured candidate list
- Handles communication errors:
  - Connection timeout → throw `AIServiceUnavailableException`
  - Invalid response format → log error and return empty list
  - HTTP error codes → throw `AIServiceUnavailableException`
- Returns list of `FlashcardCandidateDto`

#### 4. Infrastructure Layer (`FlashcardGenerationEventRepository`)

- Receives `FlashcardGenerationEvent` entity
- Uses EF Core DbContext to add entity
- Calls `SaveChangesAsync()` to persist to database
- Returns entity with populated `Id` property

#### 5. Database Layer

- Executes INSERT statement into `FlashcardGenerationEvents` table
- Generates IDENTITY value for `Id` column
- Applies default values for `CreatedAtUtc` and `UpdatedAtUtc`
- Returns inserted row data

### External Service Integration (Ollama)

#### Request to Ollama

The request varies based on the `language` parameter:

**For English (language = "en"):**

```json
{
  "model": "llama3",
  "prompt": "Generate exactly 5 flashcards from the following text. Create clear, concise questions with accurate answers in English. Return ONLY a JSON array with this exact structure: [{\"question\": \"...\", \"answer\": \"...\"}]\n\nText:\n{inputText}",
  "format": "json",
  "stream": false
}
```

**For Polish (language = "pl"):**

```json
{
  "model": "llama3",
  "prompt": "Wygeneruj dokładnie 5 fiszek z poniższego tekstu. Utwórz jasne, zwięzłe pytania z dokładnymi odpowiedziami w języku polskim. Zwróć TYLKO tablicę JSON o dokładnie takiej strukturze: [{\"question\": \"...\", \"answer\": \"...\"}]\n\nTekst:\n{inputText}",
  "format": "json",
  "stream": false
}
```

#### Response from Ollama

```json
{
  "response": "[{\"question\":\"What is TypeScript?\",\"answer\":\"TypeScript is a typed superset of JavaScript.\"},{\"question\":\"What benefit does TypeScript provide?\",\"answer\":\"It adds optional static typing to JavaScript.\"}]"
}
```

---

## 6. Security Considerations

### Authentication & Authorization

#### JWT Token Validation

- **Implementation:** Use `[Authorize]` attribute on controller action
- **Middleware:** ASP.NET Core JWT Authentication Middleware validates token signature and expiration
- **Claims Extraction:** Extract `UserId` from token claims (e.g., `ClaimTypes.NameIdentifier`)
- **Validation Points:**
  - Token signature verification using secret key
  - Token expiration check
  - Issuer and audience validation

#### User Authorization

- **Resource Ownership:** UserId from JWT token is stored in `FlashcardGenerationEvent` entity
- **Access Control:** Only the authenticated user can access their own generation events (enforced in future endpoints like "Complete Review")

### Input Validation

#### Request Body Validation

- **ASP.NET Core Model Validation:** Automatic validation using Data Annotations
  - `[Required]` - Ensures inputText is not null or empty
  - `[MaxLength(10000)]` - Prevents excessively long input (mitigates DoS attacks)
  - `[RegularExpression("^(pl|en)$")]` - Validates language parameter
- **Whitespace Check:** Trim inputText and ensure it's not only whitespace
- **Character Encoding:** Ensure input is properly encoded UTF-8 to prevent injection attacks

#### Prompt Injection Prevention

- **Risk:** Malicious user could craft input text to manipulate AI model behavior
- **Mitigation:**
  - Sanitize inputText before sending to AI model
  - Use structured prompts with clear delimiters
  - Limit AI response parsing to expected JSON format
  - Validate AI response structure before returning to client

#### AI Response Validation

- **JSON Schema Validation:** Ensure AI response matches expected structure
- **Length Limits:** Validate that generated questions/answers are reasonable lengths
- **Content Filtering:** (Optional) Check for inappropriate content in AI responses

### Data Protection

#### Sensitive Data

- **Input Text:** May contain personal or confidential information
  - Do NOT log inputText in application logs
  - Do NOT store inputText in database (only flashcard candidates)

---

## 7. Error Handling

### Error Scenarios and Responses

#### 1. Validation Errors (400 Bad Request)

**Triggers:**

- Input text exceeds 10,000 characters
- Input text is empty or whitespace only
- Language parameter is not 'pl' or 'en'

**Handling:**

- ASP.NET Core automatically returns `ValidationProblemDetails` response
- Use `ValidationBehavior` in MediatR pipeline for additional validation

**Response Example:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "inputText": ["Input text must not exceed 10000 characters"]
  }
}
```

#### 2. Authentication Errors (401 Unauthorized)

**Triggers:**

- No Authorization header present
- Bearer token is missing
- Token signature is invalid
- Token has expired

**Handling:**

- Automatically handled by ASP.NET Core JWT Authentication Middleware
- Return standardized `ProblemDetails` response

**Response Example:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication token is missing or invalid."
}
```

#### 3. AI Service Unavailable (503 Service Unavailable)

**Triggers:**

- Ollama service is not running
- Network connection to Ollama fails
- Ollama returns HTTP error (500, 502, 503)
- Request to Ollama times out

**Handling:**

- Catch `HttpRequestException` in `FlashcardAIService`
- Create custom exception: `AIServiceUnavailableException`
- Handle in `GlobalExceptionHandlerMiddleware`
- Log error with details (but not user input text)
- Return HTTP 503 with retry-after header

**Response Example:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.4",
  "title": "AI service unavailable",
  "status": 503,
  "detail": "The AI flashcard generation service is currently unavailable. Please try again later.",
  "retryAfter": 60
}
```

**Response Headers:**

```
Retry-After: 60
```

#### 4. AI Response Parsing Error (500 Internal Server Error)

**Triggers:**

- AI returns invalid JSON format
- AI response doesn't match expected schema
- AI returns empty response

**Handling:**

- Catch `JsonException` in `FlashcardAIService`
- Log detailed error (including AI response for debugging)
- Return empty candidates list or throw custom exception
- Consider fallback: return 503 instead of 500 (treat as temporary AI service issue)

**Response Example:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "Internal server error",
  "status": 500,
  "detail": "An unexpected error occurred while processing your request."
}
```

#### 5. Database Connection Error (500 Internal Server Error)

**Triggers:**

- Database connection fails
- SQL Server is unavailable
- Database timeout occurs

**Handling:**

- Catch `DbUpdateException` and `SqlException` in repository or handler
- Log error with details
- Return generic 500 error to client (don't expose database details)
- Consider retry logic with exponential backoff

**Response Example:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "Internal server error",
  "status": 500,
  "detail": "An unexpected error occurred while processing your request."
}
```

### Exception Handling Strategy

#### Global Exception Handler Middleware

**Location:** `10xdevs.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` (already exists)

**Enhancements Needed:**

- Add handling for `AIServiceUnavailableException` → return 503
- Add handling for `JsonException` → return 500
- Implement structured logging with correlation IDs

#### MediatR Pipeline Behavior

**Location:** `10xdevs.Application/Behaviors/ValidationBehavior.cs` (already exists)

**Current Functionality:**

- Validates commands before execution
- Returns validation errors automatically

**Enhancement:**

- Add logging for failed validations

#### Logging Strategy

**What to Log:**

- Request correlation ID (generated per request)
- UserId (from JWT token)
- Language parameter
- Input text length (NOT the actual text for privacy)
- AI service response time
- Number of candidates generated
- Any exceptions with stack traces

**What NOT to Log:**

- Actual input text content (privacy concern)
- JWT token values
- Sensitive user data

**Log Levels:**

- `Information`: Successful generation events, AI service calls
- `Warning`: AI service slow response, empty candidate list
- `Error`: AI service unavailable, database errors, parsing errors
- `Critical`: Unhandled exceptions

**Example Log Entry:**

```json
{
  "timestamp": "2025-12-31T10:00:00Z",
  "level": "Information",
  "correlationId": "abc-123-def",
  "userId": 42,
  "action": "GenerateFlashcards",
  "inputLength": 1500,
  "language": "en",
  "candidatesGenerated": 8,
  "aiServiceDuration": 2500
}
```

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. AI Service Response Time

**Issue:** Ollama AI model inference can take several seconds (2-10 seconds depending on model size and input length)

**Impact:** Request timeout, poor user experience

**Mitigation Strategies:**

- Set appropriate HTTP client timeout (e.g., 30 seconds)
- Implement loading indicator on frontend
- Consider async/background processing for large texts
- Use faster AI models for production (e.g., Phi-3 instead of Llama 3)
- Implement response caching for identical input texts (with cache key hashing)

#### 2. Database Write Operations

**Issue:** Each request creates a new `FlashcardGenerationEvent` record

**Impact:** Database write contention under high load

**Mitigation Strategies:**

- Use asynchronous database operations (`SaveChangesAsync`)
- Implement database connection pooling (default in EF Core)
- Consider batching for multiple simultaneous requests
- Index optimization on `UserId` column (already exists: `IX_FlashcardGenerationEvents_UserId`)

#### 3. Memory Usage

**Issue:** Large input texts (up to 10,000 characters) and AI responses can consume memory

**Impact:** Out of memory exceptions, high memory usage

**Mitigation Strategies:**

- Stream large responses from AI service instead of loading entire response into memory
- Dispose of HttpClient responses properly
- Limit concurrent requests per user (rate limiting)
- Monitor memory usage and adjust application pool settings

#### 4. Network Latency

**Issue:** Communication with external Ollama API adds network overhead

**Impact:** Increased response time

**Mitigation Strategies:**

- Host Ollama on the same server or local network
- Use HTTP/2 for improved performance
- Implement connection pooling for HttpClient

#### 5. Connection Pooling

**Strategy:** Reuse HTTP connections to Ollama service

**Implementation:**

- Configure `HttpClient` with connection lifetime settings
- Use `IHttpClientFactory` for proper client management
- Set `MaxConnectionsPerServer` appropriately

**Configuration Example:**

```csharp
services.AddHttpClient<IFlashcardAIService, FlashcardAIService>()
    .ConfigureHttpClient(client =>
    {
        client.BaseAddress = new Uri("http://localhost:11434");
        client.Timeout = TimeSpan.FromSeconds(30);
    })
    .SetHandlerLifetime(TimeSpan.FromMinutes(5));
```

## 9. Implementation Steps

### Step 1: Create Domain Interfaces

**File:** `10xdevs.Domain/Interfaces/IFlashcardGenerationEventRepository.cs`

**Tasks:**

- Define `IFlashcardGenerationEventRepository` interface
- Add methods:
  - `Task<FlashcardGenerationEvent> CreateAsync(FlashcardGenerationEvent, CancellationToken)`
  - `Task<FlashcardGenerationEvent?> GetByIdAsync(int, CancellationToken)`
  - `Task UpdateAsync(FlashcardGenerationEvent, CancellationToken)` (for future review completion)

**Dependencies:** None

---

### Step 2: Create Application Service Interface

**File:** `10xdevs.Application/Interfaces/IFlashcardAIService.cs`

**Tasks:**

- Define `IFlashcardAIService` interface
- Add method: `Task<List<FlashcardCandidateDto>> GenerateFlashcardsAsync(string inputText, string language, CancellationToken)`

**Dependencies:** None

---

### Step 3: Implement Repository

**File:** `10xdevs.Infrastructure/Repositories/FlashcardGenerationEventRepository.cs`

**Tasks:**

- Create `FlashcardGenerationEventRepository` class implementing `IFlashcardGenerationEventRepository`
- Inject `ApplicationDbContext` via constructor
- Implement `CreateAsync`:
  - Add entity to DbContext
  - Call `SaveChangesAsync()`
  - Return entity with generated Id
- Implement `GetByIdAsync`:
  - Use `FindAsync()` to retrieve entity by Id
  - Return null if not found
- Implement `UpdateAsync` (for future use):
  - Update entity in DbContext
  - Call `SaveChangesAsync()`

**Dependencies:**

- `ApplicationDbContext` (Entity Framework DbContext)
- `FlashcardGenerationEvent` entity

---

### Step 4: Implement AI Service

**File:** `10xdevs.Infrastructure/Services/FlashcardAIService.cs`

**Tasks:**

- Create `FlashcardAIService` class implementing `IFlashcardAIService`
- Inject `IHttpClientFactory` and `ILogger<FlashcardAIService>` via constructor
- Implement `GenerateFlashcardsAsync`:
  - Construct language-specific prompt based on input text and language parameter:
    - For "en": Request exactly 5 flashcards in English
    - For "pl": Request exactly 5 flashcards in Polish ("Wygeneruj dokładnie 5 fiszek...")
  - Build JSON payload for Ollama API request
  - Send HTTP POST request to Ollama endpoint
  - Parse JSON response
  - Validate response structure (should contain up to 5 flashcards)
  - Map to `List<FlashcardCandidateDto>`
  - Handle errors:
    - `HttpRequestException` → throw `AIServiceUnavailableException`
    - `JsonException` → log error and throw `AIServiceUnavailableException`
- Add configuration for Ollama endpoint URL (read from appsettings.json)

**Dependencies:**

- `IHttpClientFactory` (for HTTP client management)
- `ILogger<FlashcardAIService>` (for logging)
- `FlashcardCandidateDto` DTO

**Configuration (appsettings.json):**

```json
{
  "Ollama": {
    "BaseUrl": "http://localhost:11434",
    "Model": "phi3",
    "Timeout": 30
  }
}
```

---

### Step 5: Create Custom Exceptions

**File:** `10xdevs.Application/Exceptions/AIServiceUnavailableException.cs`

**Tasks:**

- Create `AIServiceUnavailableException` class inheriting from `Exception`
- Add constructors:
  - `AIServiceUnavailableException()`
  - `AIServiceUnavailableException(string message)`
  - `AIServiceUnavailableException(string message, Exception innerException)`

**Dependencies:** None

---

### Step 6: Create Command and Handler

**File:** `10xdevs.Application/Commands/Flashcards/GenerateFlashcards/GenerateFlashcardsCommand.cs`

**Tasks:**

- Create `GenerateFlashcardsCommand` class implementing `IRequest<GenerateFlashcardsResponseDto>`
- Add properties:
  - `int UserId`
  - `string InputText`
  - `string Language`

**File:** `10xdevs.Application/Commands/Flashcards/GenerateFlashcards/GenerateFlashcardsCommandHandler.cs`

**Tasks:**

- Create `GenerateFlashcardsCommandHandler` class implementing `IRequestHandler<GenerateFlashcardsCommand, GenerateFlashcardsResponseDto>`
- Inject dependencies:
  - `IFlashcardAIService`
  - `IFlashcardGenerationEventRepository`
  - `ILogger<GenerateFlashcardsCommandHandler>`
- Implement `Handle` method:
  1. Call `_aiService.GenerateFlashcardsAsync(request.InputText, request.Language, cancellationToken)`
  2. Generate temporary candidate IDs (e.g., "temp-1", "temp-2", etc.)
  3. Create `FlashcardGenerationEvent` entity:
     - Set `UserId` from command
     - Set `CandidatesCount` from AI response count
     - Set `AcceptedCount = 0`
     - Set `EditedCount = 0`
     - Set `CreatedAtUtc = DateTime.UtcNow`
     - Set `UpdatedAtUtc = DateTime.UtcNow`
  4. Call `_eventRepository.CreateAsync(generationEvent, cancellationToken)`
  5. Map to `GenerateFlashcardsResponseDto`:
     - Set `GenerationEventId` from saved entity
     - Set `Candidates` from AI response (with generated candidate IDs)
     - Set `CandidatesCount`
     - Set `CreatedAtUtc`
  6. Return response DTO
- Add error handling:
  - Catch `AIServiceUnavailableException` and rethrow (will be handled by global exception handler)
  - Log all operations with correlation ID

**Dependencies:**

- `GenerateFlashcardsCommand`
- `GenerateFlashcardsResponseDto`
- `IFlashcardAIService`
- `IFlashcardGenerationEventRepository`
- `FlashcardGenerationEvent` entity

---

### Step 7: Create API Controller

**File:** `10xdevs.Api/Controllers/FlashcardsController.cs` (may already exist, add new action)

**Tasks:**

- If controller doesn't exist, create `FlashcardsController` class inheriting from `ControllerBase`
- Add `[ApiController]` and `[Route("api/[controller]")]` attributes
- Add `[Authorize]` attribute to controller or specific action
- Inject `IMediator` via constructor
- Create action method:
  - Name: `GenerateFlashcards`
  - HTTP Method: `[HttpPost("generate")]`
  - Parameters: `GenerateFlashcardsRequestDto` request body
  - Implementation:
    1. Extract `UserId` from JWT claims: `int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value)`
    2. Create command: `var command = new GenerateFlashcardsCommand { UserId = userId, InputText = request.InputText, Language = request.Language ?? "en" }`
    3. Send command: `var response = await _mediator.Send(command, cancellationToken)`
    4. Return `CreatedAtAction` with response:
       - `return CreatedAtAction(nameof(GetGenerationEvent), new { id = response.GenerationEventId }, response)`
- Add model validation:
  - ASP.NET Core automatically validates using Data Annotations
  - Return 400 if `ModelState.IsValid` is false (automatic)

**Dependencies:**

- `IMediator` (MediatR)
- `GenerateFlashcardsRequestDto`
- `GenerateFlashcardsCommand`

**Example Implementation:**

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FlashcardsController : ControllerBase
{
    private readonly IMediator _mediator;

    public FlashcardsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("generate")]
    [ProducesResponseType(typeof(GenerateFlashcardsResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<GenerateFlashcardsResponseDto>> GenerateFlashcards(
        [FromBody] GenerateFlashcardsRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var command = new GenerateFlashcardsCommand
        {
            UserId = userId,
            InputText = request.InputText,
            Language = request.Language ?? "en"
        };

        var response = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetGenerationEvent),
            new { id = response.GenerationEventId },
            response);
    }

    // Placeholder for future endpoint
    [HttpGet("generation/{id}")]
    public async Task<ActionResult> GetGenerationEvent(int id)
    {
        return NotFound(); // To be implemented later
    }
}
```

---

### Step 8: Update Global Exception Handler

**File:** `10xdevs.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` (already exists)

**Tasks:**

- Add handling for `AIServiceUnavailableException`:
  - Return HTTP 503 with ProblemDetails response
  - Include `Retry-After` header (60 seconds)
  - Log error with details
- Ensure generic exceptions return HTTP 500
- Add correlation ID to all error responses

**Example Enhancement:**

```csharp
catch (AIServiceUnavailableException ex)
{
    await HandleAIServiceUnavailableException(context, ex);
}

private async Task HandleAIServiceUnavailableException(
    HttpContext context,
    AIServiceUnavailableException exception)
{
    context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
    context.Response.Headers.Add("Retry-After", "60");

    var problemDetails = new ProblemDetails
    {
        Type = "https://tools.ietf.org/html/rfc7231#section-6.6.4",
        Title = "AI service unavailable",
        Status = StatusCodes.Status503ServiceUnavailable,
        Detail = "The AI flashcard generation service is currently unavailable. Please try again later."
    };

    await context.Response.WriteAsJsonAsync(problemDetails);
}
```

---

### Step 9: Register Services in DI Container

**File:** `10xdevs.Api/Extensions/ServiceCollectionExtensions.cs` or `Program.cs`

**Tasks:**

- Register `IFlashcardAIService` with `FlashcardAIService` implementation:
  ```csharp
  services.AddHttpClient<IFlashcardAIService, FlashcardAIService>()
      .ConfigureHttpClient((serviceProvider, client) =>
      {
          var config = serviceProvider.GetRequiredService<IConfiguration>();
          client.BaseAddress = new Uri(config["Ollama:BaseUrl"]!);
          client.Timeout = TimeSpan.FromSeconds(int.Parse(config["Ollama:Timeout"]!));
      });
  ```
- Register `IFlashcardGenerationEventRepository` with `FlashcardGenerationEventRepository`:
  ```csharp
  services.AddScoped<IFlashcardGenerationEventRepository, FlashcardGenerationEventRepository>();
  ```

**Dependencies:**

- `IConfiguration` (for reading appsettings.json)

---

### Step 10: Update Database Context

**File:** `10xdevs.Infrastructure/Data/ApplicationDbContext.cs`

**Tasks:**

- Ensure `DbSet<FlashcardGenerationEvent>` is defined:
  ```csharp
  public DbSet<FlashcardGenerationEvent> FlashcardGenerationEvents { get; set; }
  ```
- Ensure entity configuration exists (likely already configured if migrations exist)

---

### Step 11: Fix DTO Typo

**File:** `10xdevs.Application/DTOs/Flashcards/GenerateFlashcardsResponseDto.cs`

**Tasks:**

- Rename property from `CadidatesCount` to `CandidatesCount`
- Update any references in code

---

### Step 12: Add Configuration

**File:** `10xdevs.Api/appsettings.json` and `appsettings.Development.json`

**Tasks:**

- Add Ollama configuration section:
  ```json
  {
    "Ollama": {
      "BaseUrl": "http://localhost:11434",
      "Model": "phi3",
      "Timeout": 30
    }
  }
  ```

---

### Step 13: Testing

#### Manual Testing

1. Start Ollama service locally
2. Test endpoint with Swagger UI
3. Verify database records are created
4. Test error scenarios:
   - Stop Ollama service → verify 503 response
   - Send invalid token → verify 401 response
   - Send text exceeding 10,000 chars → verify 400 response

---

### Step 14: Documentation

**Tasks:**

- Update Swagger documentation with XML comments
- Add example requests/responses in Swagger
- Document Ollama setup instructions in README
- Update API documentation with new endpoint details

**Example XML Comments:**

```csharp
/// <summary>
/// Generates flashcard candidates from input text using AI.
/// </summary>
/// <param name="request">The input text and optional language parameter</param>
/// <param name="cancellationToken">Cancellation token</param>
/// <returns>A list of flashcard candidates and generation event ID</returns>
/// <response code="201">Flashcards generated successfully</response>
/// <response code="400">Invalid request data</response>
/// <response code="401">Unauthorized - invalid or missing token</response>
/// <response code="503">AI service unavailable</response>
[HttpPost("generate")]
public async Task<ActionResult<GenerateFlashcardsResponseDto>> GenerateFlashcards(...)
```

---

### Step 15: Deployment Checklist

**Pre-Deployment:**

- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Test with local Ollama instance
- [ ] Verify database migrations are up to date
- [ ] Review appsettings.json for production values
- [ ] Ensure HTTPS is enforced
- [ ] Configure rate limiting
- [ ] Set up logging and monitoring

**Deployment:**

- [ ] Deploy backend application
- [ ] Verify Ollama service is running and accessible
- [ ] Test endpoint in production environment
- [ ] Monitor error rates and response times
- [ ] Verify database connections

**Post-Deployment:**

- [ ] Monitor AI service response times
- [ ] Check database for generation event records
- [ ] Verify authentication is working
- [ ] Test error scenarios (AI service down, invalid input)
- [ ] Monitor application logs for issues

---

## 10. Dependencies Summary

### NuGet Packages Required

- `MediatR` (already in project)
- `Microsoft.AspNetCore.Authentication.JwtBearer` (already in project)
- `Microsoft.EntityFrameworkCore` (already in project)
- `Microsoft.EntityFrameworkCore.SqlServer` (already in project)

### External Services

- **Ollama:** Local AI model hosting service
  - Installation: https://ollama.ai/
  - Default port: 11434
  - Recommended model: phi3 (faster) or llama3

### Database Requirements

- SQL Server instance
- `FlashcardGenerationEvents` table (already defined in database schema)
- Proper indexes on `UserId` column

---

## Appendix: Example Prompts for Ollama

### English Prompt

```
Generate exactly 5 flashcards from the following text. Create clear, concise questions with accurate answers in English. Return ONLY a JSON array with this exact structure: [{"question": "...", "answer": "..."}]

Text:
{inputText}
```

### Polish Prompt

```
Wygeneruj dokładnie 5 fiszek z poniższego tekstu. Utwórz jasne, zwięzłe pytania z dokładnymi odpowiedziami w języku polskim. Zwróć TYLKO tablicę JSON o dokładnie takiej strukturze: [{"question": "...", "answer": "..."}]

Tekst:
{inputText}
```

---

**End of Implementation Plan**
