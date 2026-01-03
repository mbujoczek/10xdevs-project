# API Endpoint Implementation Plan: Login User

## 1. Endpoint Overview

The **Login User** endpoint authenticates an existing user by validating their username and password credentials against stored data in the database. Upon successful authentication, the endpoint generates and returns a JWT (JSON Web Token) that the client can use for subsequent authenticated requests.

**Key Characteristics:**

- Public endpoint (no authentication required)
- Authenticates credentials against hashed passwords
- Returns JWT token valid for 24 hours
- Case-sensitive username validation
- Secure password verification using BCrypt

---

## 2. Request Details

### HTTP Method and Path

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Authentication:** None (public endpoint)

### Request Parameters

#### Headers

- `Content-Type: application/json` (required)

#### Request Body

```json
{
  "username": "string (required, case-sensitive)",
  "password": "string (required)"
}
```

**Validation Rules:**

- `username`: Required, non-empty string
- `password`: Required, non-empty string

**Example Request:**

```json
{
  "username": "JohnDoe",
  "password": "SecurePassword123"
}
```

---

## 3. Used Types

### DTOs (Data Transfer Objects)

#### LoginRequestDto

Location: `10xdevs.Application/DTOs/Auth/LoginRequestDto.cs`

```csharp
public class LoginRequestDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
```

**Purpose:** Encapsulates login credentials from client request

#### LoginResponseDto

Location: `10xdevs.Application/DTOs/Auth/LoginResponseDto.cs`

```csharp
public class LoginResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
```

**Purpose:** Contains authenticated user information and JWT token

### Command and Handler

#### LoginCommand

Location: `10xdevs.Application/Commands/Users/LoginUser/LoginCommand.cs`

```csharp
public class LoginCommand : IRequest<LoginResponseDto>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

**Purpose:** Encapsulates login command for MediatR pipeline

#### LoginCommandHandler

Location: `10xdevs.Application/Commands/Users/LoginUser/LoginCommandHandler.cs`

```csharp
public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<LoginCommandHandler> _logger;

    // Constructor and Handle method implementation
}
```

**Purpose:** Handles login logic, password verification, and token generation

### Domain Entity

#### User

Location: `10xdevs.Domain/Entities/User.cs` (existing)

```csharp
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public ICollection<Flashcard> Flashcards { get; set; } = [];
    public ICollection<FlashcardGenerationEvent> FlashcardGenerationEvents { get; set; } = [];
}
```

### Service Interfaces

#### IUserRepository

Location: `10xdevs.Domain/Interfaces/IUserRepository.cs` (existing)

```csharp
public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
}
```

**Relevant Method:** `GetByUsernameAsync()` - Retrieves user by username (case-sensitive)

#### IPasswordHashingService

Location: `10xdevs.Application/Interfaces/IPasswordHashingService.cs` (existing)

```csharp
public interface IPasswordHashingService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
```

**Relevant Method:** `VerifyPassword()` - Verifies plain-text password against BCrypt hash

#### IJwtTokenService

Location: `10xdevs.Application/Interfaces/IJwtTokenService.cs` (existing)

```csharp
public interface IJwtTokenService
{
    string GenerateToken(int userId, string username);
    ClaimsPrincipal? ValidateToken(string token);
}
```

**Relevant Method:** `GenerateToken()` - Generates JWT token with user claims

---

## 4. Response Details

### Success Response (200 OK)

**HTTP Status:** `200 OK`

**Response Body:**

```json
{
  "id": 1,
  "username": "JohnDoe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidW5pcXVlX25hbWUiOiJKb2huRG9lIiwianRpIjoiN2E3YjFjNGQtZTU4Yi00ZmE5LWE3MmQtOGM5YjFhMmQ1ZTNmIiwiaWF0IjoxNzM1NjQ4ODAwLCJleHAiOjE3MzU3MzUyMDB9.K8x7vY2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4",
  "expiresAt": "2025-12-31T22:00:00Z"
}
```

**Field Descriptions:**

- `id`: User's unique identifier (integer)
- `username`: Case-preserved username from database
- `token`: JWT token string for authentication
- `expiresAt`: ISO 8601 timestamp when token expires (UTC)

**Token Claims:**

- `sub`: User ID (e.g., "1")
- `unique_name`: Username (e.g., "JohnDoe")
- `jti`: Unique token identifier (GUID)
- `iat`: Issued at timestamp (Unix epoch)
- `exp`: Expiration timestamp (issued at + 24 hours)

### Error Responses

#### 400 Bad Request - Invalid Request Format

**Scenario:** Missing required fields or validation failure

**Response Body:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "username": ["The Username field is required."],
    "password": ["The Password field is required."]
  }
}
```

**Triggers:**

- Empty or null username
- Empty or null password
- Malformed JSON body

#### 401 Unauthorized - Invalid Credentials

**Scenario:** Username not found or password verification failed

**Response Body:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Invalid credentials",
  "status": 401,
  "detail": "The username or password is incorrect."
}
```

**Triggers:**

- Username does not exist in database (case-sensitive check)
- Password does not match stored hash

**Security Note:** Response message is intentionally vague to prevent user enumeration attacks. The system does not distinguish between "user not found" and "wrong password" in the response.

---

## 5. Data Flow

### High-Level Flow Diagram

```
Client Request
    ↓
[Controller: AuthController]
    ↓
[MediatR] → Send LoginCommand
    ↓
[Pipeline Behavior: ValidationBehavior]
    ↓ (if validation passes)
[LoginCommandHandler]
    ↓
[Retrieve User by Username] → IUserRepository.GetByUsernameAsync()
    ↓ (if user not found) → throw InvalidCredentialsException
    ↓ (if user found)
[Verify Password] → IPasswordHashingService.VerifyPassword()
    ↓ (if password invalid) → throw InvalidCredentialsException
    ↓ (if password valid)
[Generate JWT Token] → IJwtTokenService.GenerateToken()
    ↓
[Calculate Expiration] → DateTime.UtcNow.AddHours(24)
    ↓
[Map to Response DTO]
    ↓
[Return 200 OK]
    ↓
Client Response
```

### Detailed Step-by-Step Flow

1. **Client Request**

   - Client sends POST request to `/api/auth/login`
   - Content-Type: `application/json`
   - Body contains username and password

2. **Controller Reception**

   - `AuthController.Login()` receives request
   - ASP.NET Core model binding deserializes JSON to `LoginRequestDto`
   - Built-in validation checks `[Required]` attributes

3. **Validation**

   - If model binding or validation fails, returns 400 Bad Request
   - ValidationBehavior (MediatR pipeline) validates the command
   - If validation passes, continues to handler

4. **Command Dispatch**

   - Controller creates `LoginCommand` from DTO
   - MediatR dispatches command to `LoginCommandHandler`

5. **User Retrieval**

   - Handler calls `IUserRepository.GetByUsernameAsync(username)`
   - Entity Framework executes case-sensitive query:
     ```sql
     SELECT * FROM Users WHERE Username = @username
     ```
   - Returns `User?` (nullable)

6. **User Existence Check**

   - If `user == null`:
     - Handler logs warning with masked username
     - Throws `InvalidCredentialsException`
     - Exception handled by global exception handler
     - Returns 401 Unauthorized

7. **Password Verification**

   - Handler calls `IPasswordHashingService.VerifyPassword(password, user.PasswordHash)`
   - BCrypt service verifies plain-text password against stored hash
   - Returns `bool` indicating match

8. **Password Validation Check**

   - If `VerifyPassword() == false`:
     - Handler logs warning with user ID (not username)
     - Throws `InvalidCredentialsException`
     - Returns 401 Unauthorized

9. **JWT Token Generation**

   - Handler calls `IJwtTokenService.GenerateToken(user.Id, user.Username)`
   - Service creates JWT with claims:
     - `sub`: User ID
     - `unique_name`: Username
     - `jti`: Unique token GUID
     - `iat`: Current timestamp
     - `exp`: Current timestamp + 24 hours
   - Token is signed with HMAC-SHA256 using configured secret key
   - Returns signed JWT string

10. **Expiration Calculation**

    - Handler calculates `expiresAt = DateTime.UtcNow.AddHours(24)`
    - Value matches JWT `exp` claim

11. **Response Mapping**

    - Handler creates `LoginResponseDto`:
      - `Id` = user.Id
      - `Username` = user.Username
      - `Token` = generated JWT
      - `ExpiresAt` = calculated expiration
    - Returns DTO to controller via MediatR

12. **HTTP Response**

    - Controller receives DTO
    - Returns `Ok(response)` with status 200
    - Serializes DTO to JSON response body

---

## 6. Security Considerations

### Password Security

#### Verification Process

- Uses BCrypt algorithm for password verification
- Constant-time comparison prevents timing attacks
- No raw passwords stored or logged
- Work factor: 12 (configurable, balances security and performance)

#### Password Hashing Details

- Algorithm: BCrypt with salt
- Hash format: `$2a$12$[22-char-salt][31-char-hash]`
- Salt: Automatically generated per password
- Hash length: 60 characters

### Username Security

#### Case Sensitivity

- Database constraint: Unique index with case-sensitive collation (`SQL_Latin1_General_CP1_CS_AS`)
- Entity Framework query: Uses `==` operator (translates to case-sensitive SQL)
- Prevents confusion: "JohnDoe" ≠ "johndoe" ≠ "JOHNDOE"

### JWT Token Security

#### Token Configuration

- **Algorithm:** HS256 (HMAC-SHA256)
- **Secret Key:**
  - Minimum 256 bits (32 bytes) as per JWT specification
  - Stored in `appsettings.json` (development) or secure configuration (production)
  - Example: Azure Key Vault, AWS Secrets Manager, environment variables
  - Never hardcoded or committed to source control
- **Expiration:** 24 hours (configurable via `Jwt:ExpirationHours`)
- **Claims:** Minimal set to reduce token size
  - `sub`: User ID (integer as string)
  - `unique_name`: Username
  - `jti`: Unique token identifier (prevents replay attacks)
  - `iat`: Issued at timestamp

#### Token Transmission

- Always use HTTPS in production environments
- Token sent in `Authorization: Bearer {token}` header
- Never send token in URL query parameters (logged in server logs, browser history)
- Never store token in cookies without secure flags

### Error Response Security

#### User Enumeration Prevention

- Both "user not found" and "wrong password" return same error message
- Generic message: "The username or password is incorrect."
- Prevents attackers from discovering valid usernames
- Response timing should be consistent (BCrypt naturally provides this)

#### Logging Considerations

- Log failed login attempts with:
  - Timestamp
  - IP address (if available)
  - Attempted username (hashed or masked)
  - Reason: "User not found" vs "Invalid password"
- Do NOT log passwords (ever)
- Consider rate limiting based on IP/username

---

## 7. Error Handling

### Application-Level Exceptions

#### InvalidCredentialsException

**Location:** `10xdevs.Application/Exceptions/InvalidCredentialsException.cs`

**Purpose:** Thrown when user not found or password verification fails

**Definition:**

```csharp
public class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException()
        : base("The username or password is incorrect.")
    {
    }
}
```

**Handled By:** `GlobalExceptionHandlerMiddleware`

**Maps To:** 401 Unauthorized with ProblemDetails response

### Global Exception Handling

The `GlobalExceptionHandlerMiddleware` maps exceptions to appropriate HTTP responses:

```csharp
catch (InvalidCredentialsException ex)
{
    await HandleExceptionAsync(context, ex, StatusCodes.Status401Unauthorized);
}
```

**ProblemDetails Response:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Invalid credentials",
  "status": 401,
  "detail": "The username or password is incorrect."
}
```

### Validation Errors

**Handled By:** ASP.NET Core Model Validation + FluentValidation (via ValidationBehavior)

**Scenarios:**

- Missing required fields (username, password)
- Empty strings after trimming
- Malformed JSON

**Response:** 400 Bad Request with validation errors

### Database Errors

**Scenario:** Database connection failure, timeout

**Exception:** `DbUpdateException`, `SqlException`

**Handling:**

- Caught by global exception handler
- Logged with full stack trace
- Returns 500 Internal Server Error
- Generic error message (no database details exposed)

**Response:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "An error occurred while processing your request.",
  "status": 500
}
```

---

## 8. Performance Considerations

### Database Query Optimization

#### Index Usage

- Username lookup uses unique index: `UQ_Users_Username`
- Case-sensitive collation: `SQL_Latin1_General_CP1_CS_AS`
- Index supports efficient `WHERE Username = @username` queries
- Query execution: O(log n) time complexity

#### Query Efficiency

```sql
-- Generated query
SELECT [u].[Id], [u].[Username], [u].[PasswordHash], [u].[CreatedAtUtc], [u].[UpdatedAtUtc]
FROM [Users] AS [u]
WHERE [u].[Username] = @username
```

**Performance Characteristics:**

- Single-row lookup
- Index seek (not scan)
- No joins required
- Minimal data transfer

### Password Verification Performance

#### BCrypt Performance

- Work factor: 12 (configurable)
- Average verification time: 250-350ms (by design, prevents brute force)
- Non-blocking: Use `async/await` pattern
- Trade-off: Security vs. speed (security wins)

**Note:** BCrypt's slowness is intentional and beneficial for security.

### Token Generation Performance

#### JWT Generation

- In-memory operation (no I/O)
- Lightweight cryptographic operation
- Average generation time: <5ms
- No external dependencies

### Caching Opportunities

**Not Recommended for Login:**

- Do NOT cache user credentials
- Do NOT cache password hashes
- Do NOT cache JWT tokens

### Scalability

#### Horizontal Scaling

- Endpoint is stateless
- No session storage required
- Can run on multiple servers without shared state
- Load balancer distributes requests

#### Database Connection Pooling

- Entity Framework Core manages connection pooling
- Default pool size: 100 connections
- Ensure `MultipleActiveResultSets=True` if needed

---

## 9. Implementation Steps

### Step 1: Create Exception Class

**1.1 Create InvalidCredentialsException**

File: `10xdevs.Application/Exceptions/InvalidCredentialsException.cs`

```csharp
namespace _10xdevs.Application.Exceptions;

/// <summary>
/// Exception thrown when login credentials are invalid.
/// Message is intentionally generic to prevent user enumeration attacks.
/// </summary>
public class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException()
        : base("The username or password is incorrect.")
    {
    }
}
```

**Purpose:** Provides generic error message for both "user not found" and "invalid password" scenarios.

---

### Step 2: Create Command, Validator, and Handler

**2.1 Create LoginCommand**

File: `10xdevs.Application/Commands/Users/LoginUser/LoginCommand.cs`

```csharp
using MediatR;
using _10xdevs.Application.DTOs.Auth;

namespace _10xdevs.Application.Commands.Users.LoginUser;

public class LoginCommand : IRequest<LoginResponseDto>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

**2.2 Create LoginCommandValidator**

File: `10xdevs.Application/Commands/Users/LoginUser/LoginCommandValidator.cs`

```csharp
using FluentValidation;

namespace _10xdevs.Application.Commands.Users.LoginUser;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
```

**Purpose:** Validates that username and password are provided (basic validation only).

**2.3 Create LoginCommandHandler**

File: `10xdevs.Application/Commands/Users/LoginUser/LoginCommandHandler.cs`

```csharp
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using _10xdevs.Application.DTOs.Auth;
using _10xdevs.Application.Exceptions;
using _10xdevs.Application.Interfaces;
using _10xdevs.Domain.Interfaces;

namespace _10xdevs.Application.Commands.Users.LoginUser;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHashingService passwordHashingService,
        IJwtTokenService jwtTokenService,
        IConfiguration configuration,
        ILogger<LoginCommandHandler> logger)
    {
        _userRepository = userRepository;
        _passwordHashingService = passwordHashingService;
        _jwtTokenService = jwtTokenService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponseDto> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        // Retrieve user by username (case-sensitive)
        var user = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning(
                "Login attempt failed: User not found. Username: {Username}",
                request.Username.Substring(0, Math.Min(3, request.Username.Length)) + "***");
            throw new InvalidCredentialsException();
        }

        // Verify password
        var isPasswordValid = _passwordHashingService.VerifyPassword(
            request.Password,
            user.PasswordHash);

        if (!isPasswordValid)
        {
            _logger.LogWarning(
                "Login attempt failed: Invalid password. UserId: {UserId}",
                user.Id);
            throw new InvalidCredentialsException();
        }

        _logger.LogInformation(
            "User logged in successfully. UserId: {UserId}, Username: {Username}",
            user.Id,
            user.Username);

        // Generate JWT token
        var token = _jwtTokenService.GenerateToken(user.Id, user.Username);

        // Calculate token expiration
        var expirationHours = int.Parse(_configuration["Jwt:ExpirationHours"] ?? "24");
        var expiresAt = DateTime.UtcNow.AddHours(expirationHours);

        // Map to response DTO
        return new LoginResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Token = token,
            ExpiresAt = expiresAt
        };
    }
}
```

**Key Implementation Details:**

- **User Retrieval:** Uses existing `IUserRepository.GetByUsernameAsync()` method
- **Password Verification:** Uses existing `IPasswordHashingService.VerifyPassword()` method
- **Token Generation:** Uses existing `IJwtTokenService.GenerateToken()` method
- **Security:**
  - Throws same exception for "user not found" and "invalid password"
  - Logs masked username for "user not found" (first 3 chars)
  - Logs user ID (not username) for "invalid password"
- **Expiration Calculation:** Reads from configuration, defaults to 24 hours

---

### Step 3: Update Global Exception Handler

**3.1 Add InvalidCredentialsException Handling**

File: `10xdevs.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`

Update the exception handling logic to map `InvalidCredentialsException` to 401:

```csharp
// Add this case in the exception handling switch/if-else block
if (exception is InvalidCredentialsException)
{
    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    problemDetails = new ProblemDetails
    {
        Type = "https://tools.ietf.org/html/rfc7235#section-3.1",
        Title = "Invalid credentials",
        Status = StatusCodes.Status401Unauthorized,
        Detail = exception.Message
    };
}
```

**Note:** If using a centralized exception mapping, add to the mapping dictionary:

```csharp
private static readonly Dictionary<Type, int> ExceptionStatusCodes = new()
{
    { typeof(DuplicateUsernameException), StatusCodes.Status409Conflict },
    { typeof(InvalidCredentialsException), StatusCodes.Status401Unauthorized }
};
```

---

### Step 4: Add Login Endpoint to Controller

**4.1 Update AuthController**

File: `10xdevs.Api/Controllers/AuthController.cs`

Add the Login action method:

```csharp
/// <summary>
/// Authenticate user and return JWT token
/// </summary>
/// <param name="request">Login credentials containing username and password</param>
/// <param name="cancellationToken">Cancellation token</param>
/// <returns>User information with authentication token</returns>
/// <response code="200">User successfully authenticated</response>
/// <response code="400">Invalid request format</response>
/// <response code="401">Invalid credentials</response>
/// <response code="500">Internal server error</response>
[HttpPost("login")]
[ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
public async Task<IActionResult> Login(
    [FromBody] LoginRequestDto request,
    CancellationToken cancellationToken)
{
    var command = new LoginCommand
    {
        Username = request.Username,
        Password = request.Password
    };

    var response = await _mediator.Send(command, cancellationToken);

    return Ok(response);
}
```

**Don't forget to add the using statement:**

```csharp
using _10xdevs.Application.Commands.Users.LoginUser;
```

---

### Step 5: Testing

**5.1 Manual Testing with Swagger**

1. Start the application
2. Navigate to Swagger UI (e.g., `https://localhost:5001/swagger`)
3. Test the `/api/auth/login` endpoint:

   **Test Case 1: Valid Credentials**

   ```json
   {
     "username": "JohnDoe",
     "password": "SecurePassword123"
   }
   ```

   Expected: 200 OK with token

   **Test Case 2: Invalid Password**

   ```json
   {
     "username": "JohnDoe",
     "password": "WrongPassword"
   }
   ```

   Expected: 401 Unauthorized

   **Test Case 3: User Not Found**

   ```json
   {
     "username": "NonExistentUser",
     "password": "SomePassword"
   }
   ```

   Expected: 401 Unauthorized

   **Test Case 4: Missing Fields**

   ```json
   {
     "username": "",
     "password": ""
   }
   ```

   Expected: 400 Bad Request

---

### Step 6: Update API Documentation

**6.1 Enable XML Documentation**

Ensure XML documentation is enabled in the project file:

File: `10xdevs.Api/10xdevs.Api.csproj`

```xml
<PropertyGroup>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
```

**6.2 Verify Swagger Configuration**

Ensure `Program.cs` includes XML comments:

```csharp
builder.Services.AddSwaggerGen(c =>
{
    // ... existing configuration ...

    // Include XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});
```

---

## 10. Verification Checklist

After implementation, verify the following:

- [ ] `InvalidCredentialsException` class created
- [ ] `LoginCommand` created with proper properties
- [ ] `LoginCommandValidator` validates required fields
- [ ] `LoginCommandHandler` implemented with all dependencies
- [ ] User retrieval uses case-sensitive username lookup
- [ ] Password verification uses BCrypt
- [ ] JWT token generation includes all required claims
- [ ] Token expiration calculated correctly (24 hours)
- [ ] Global exception handler maps `InvalidCredentialsException` to 401
- [ ] `AuthController.Login()` action added with proper attributes
- [ ] Swagger documentation displays correctly
- [ ] Unit tests pass for all scenarios (valid, invalid password, user not found)
- [ ] Integration tests pass for endpoint
- [ ] Manual testing with Swagger confirms correct behavior
- [ ] Error responses are generic (no user enumeration)
- [ ] Logging does not expose sensitive information (passwords)
- [ ] Logging includes appropriate security warnings for failed attempts

---

## 11. Security Audit Points

Before deploying to production:

- [ ] JWT secret key is stored securely (not in source control)
- [ ] HTTPS is enforced for all requests
- [ ] Rate limiting is implemented (5 attempts per 15 minutes recommended)
- [ ] Failed login attempts are logged with IP addresses
- [ ] Passwords are never logged in plain text
- [ ] Error responses do not reveal whether username exists
- [ ] Token expiration is appropriate for application security requirements
- [ ] Database uses case-sensitive collation for Username column
- [ ] BCrypt work factor is appropriate (12 recommended)
- [ ] Global exception handler does not expose internal error details

---

## End of Implementation Plan
