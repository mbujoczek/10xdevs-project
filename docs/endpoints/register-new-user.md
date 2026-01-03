# API Endpoint Implementation Plan: Register New User

## 1. Endpoint Overview

This endpoint handles user registration for the AI Flashcard Generator application. It creates a new user account by accepting a username and password, validates the input, securely stores the credentials with password hashing, and returns a JWT authentication token for immediate use. This is a public endpoint that does not require prior authentication.

**Key Features:**

- Username uniqueness validation (case-sensitive)
- Secure password hashing using industry-standard algorithms
- Automatic JWT token generation upon successful registration
- Immediate user authentication after registration

---

## 2. Request Details

### HTTP Method

`POST`

### URL Structure

`/api/auth/register`

### Parameters

#### Required Parameters

- **username** (string, in request body)

  - Maximum length: 50 characters
  - Case-sensitive
  - Must be unique across all users
  - Cannot be empty or whitespace-only

- **password** (string, in request body)
  - Minimum length: 8 characters
  - Plain text (will be hashed server-side)
  - Should encourage complexity (letters, numbers, symbols) though not enforced initially

#### Optional Parameters

None

### Request Headers

- `Content-Type: application/json` (required)

### Request Body Structure

```json
{
  "username": "JohnDoe",
  "password": "SecurePassword123"
}
```

**Request Body Schema:**

- Type: `RegisterRequestDto`
- Validation: Applied via Data Annotations and FluentValidation

---

## 3. Used Types

### DTOs (Data Transfer Objects)

#### RegisterRequestDto

Location: `10xdevs.Application/DTOs/Auth/RegisterRequestDto.cs`

```csharp
public class RegisterRequestDto
{
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
```

#### RegisterResponseDto

Location: `10xdevs.Application/DTOs/Auth/RegisterResponseDto.cs`

```csharp
public class RegisterResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}
```

### Command and Handler

#### RegisterUserCommand

Location: `10xdevs.Application/Commands/Users/RegisterUser/RegisterUserCommand.cs`

```csharp
public class RegisterUserCommand : IRequest<RegisterResponseDto>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

#### RegisterUserCommandHandler

Location: `10xdevs.Application/Commands/Users/RegisterUser/RegisterUserCommandHandler.cs`

```csharp
public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, RegisterResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<RegisterUserCommandHandler> _logger;

    // Constructor and Handle method implementation
}
```

#### RegisterUserCommandValidator

Location: `10xdevs.Application/Commands/Users/RegisterUser/RegisterUserCommandValidator.cs`

```csharp
public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required")
            .MaximumLength(50).WithMessage("Username must not exceed 50 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long");
    }
}
```

### Domain Entity

#### User

Location: `10xdevs.Domain/Entities/User.cs`

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

Location: `10xdevs.Domain/Interfaces/IUserRepository.cs`

```csharp
public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
}
```

#### IPasswordHashingService

Location: `10xdevs.Application/Interfaces/IPasswordHashingService.cs`

```csharp
public interface IPasswordHashingService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
```

#### IJwtTokenService

Location: `10xdevs.Application/Interfaces/IJwtTokenService.cs`

```csharp
public interface IJwtTokenService
{
    string GenerateToken(int userId, string username);
    ClaimsPrincipal? ValidateToken(string token);
}
```

#### IUnitOfWork

Location: `10xdevs.Domain/Interfaces/IUnitOfWork.cs`

```csharp
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

**Why Unit of Work?**

- `DbContext` is already a Unit of Work implementation
- Separates transaction management from repository concerns
- Enables atomic operations across multiple repositories
- Follows Single Responsibility Principle

---

## 4. Response Details

### Success Response (201 Created)

**Status Code:** `201 Created`

**Headers:**

- `Content-Type: application/json`
- `Location: /api/users/{id}` (optional, points to user profile if implemented)

**Response Body:**

```json
{
  "id": 1,
  "username": "JohnDoe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidW5pcXVlX25hbWUiOiJKb2huRG9lIiwibmJmIjoxNzM1NjM4MDAwLCJleHAiOjE3MzU3MjQ0MDAsImlhdCI6MTczNTYzODAwMH0.xxxxx",
  "createdAtUtc": "2025-12-31T10:00:00Z"
}
```

**Field Descriptions:**

- `id`: Unique user identifier (integer, auto-generated)
- `username`: Registered username (string, case-preserved as entered)
- `token`: JWT bearer token (string, valid for 24 hours by default)
- `createdAtUtc`: Account creation timestamp in UTC (ISO 8601 format)

### Error Responses

#### 400 Bad Request - Validation Failed

**Scenario:** Input validation fails (missing fields, password too short, username too long)

**Response Body:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "username": ["Username is required"],
    "password": ["Password must be at least 8 characters long"]
  }
}
```

**Triggers:**

- Empty or null username
- Username exceeds 50 characters
- Empty or null password
- Password shorter than 8 characters

#### 409 Conflict - Username Already Exists

**Scenario:** Username is already taken (case-sensitive check)

**Response Body:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Username already exists",
  "status": 409,
  "detail": "A user with the username 'JohnDoe' already exists."
}
```

**Triggers:**

- Exact username match found in database (case-sensitive)

#### 500 Internal Server Error

**Scenario:** Unexpected server-side errors (database unavailable, hashing failure, token generation failure)

**Response Body:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "detail": "Internal server error. Please try again later."
}
```

**Triggers:**

- Database connection failure
- Password hashing algorithm failure
- JWT token generation failure
- Entity Framework save operation failure

---

## 5. Data Flow

### High-Level Flow Diagram

```
Client Request
    ↓
[Controller: AuthController]
    ↓
[MediatR] → Send RegisterUserCommand
    ↓
[Pipeline Behavior: ValidationBehavior]
    ↓ (if validation passes)
[RegisterUserCommandHandler]
    ↓
[Check Username Uniqueness] → IUserRepository.UsernameExistsAsync()
    ↓ (if username available)
[Hash Password] → IPasswordHashingService.HashPassword()
    ↓
[Create User Entity]
    ↓
[Save to Database] → IUserRepository.AddAsync() + IUnitOfWork.SaveChangesAsync()
    ↓
[Generate JWT Token] → IJwtTokenService.GenerateToken()
    ↓
[Map to Response DTO]
    ↓
[Return 201 Created]
    ↓
Client Response
```

### Detailed Step-by-Step Flow

1. **Request Reception**

   - Controller receives POST request at `/api/auth/register`
   - Model binding deserializes JSON to `RegisterRequestDto`
   - ASP.NET Core applies Data Annotation validation

2. **Command Creation and Dispatch**

   - Controller creates `RegisterUserCommand` from DTO
   - Command is sent via MediatR to the pipeline

3. **Validation Pipeline**

   - MediatR ValidationBehavior intercepts the command
   - `RegisterUserCommandValidator` executes FluentValidation rules
   - If validation fails: Return 400 Bad Request with validation errors
   - If validation passes: Continue to handler

4. **Username Uniqueness Check**

   - Handler calls `IUserRepository.UsernameExistsAsync(username)`
   - Repository executes case-sensitive query: `WHERE Username = @username`
   - If username exists: Throw `DuplicateUsernameException` → 409 Conflict
   - If username available: Continue

5. **Password Hashing**

   - Handler calls `IPasswordHashingService.HashPassword(password)`
   - Service uses BCrypt/PBKDF2 with automatic salt generation
   - Returns hashed password string (e.g., 60-72 characters for BCrypt)

6. **User Entity Creation**

   - Create new `User` entity with:
     - `Username` = input username (case-preserved)
     - `PasswordHash` = hashed password
     - `CreatedAtUtc` = `DateTime.UtcNow`
     - `UpdatedAtUtc` = `DateTime.UtcNow`

7. **Database Persistence**

   - Handler calls `IUserRepository.AddAsync(user)`
   - Entity Framework tracks the new entity
   - Handler calls `IUnitOfWork.SaveChangesAsync()`
   - EF Core executes SQL INSERT with automatic Id generation
   - User.Id is populated with generated identity value

8. **JWT Token Generation**

   - Handler calls `IJwtTokenService.GenerateToken(user.Id, user.Username)`
   - Service creates JWT with claims:
     - `sub`: User Id
     - `unique_name`: Username
     - `nbf`: Not before (current timestamp)
     - `exp`: Expiration (current timestamp + 24 hours)
     - `iat`: Issued at (current timestamp)
   - Token is signed with configured secret key
   - Returns signed JWT string

9. **Response Mapping**

   - Handler creates `RegisterResponseDto`:
     - `Id` = user.Id
     - `Username` = user.Username
     - `Token` = generated JWT
     - `CreatedAtUtc` = user.CreatedAtUtc
   - Returns DTO to controller via MediatR

10. **HTTP Response**
    - Controller receives DTO
    - Returns `CreatedAtAction` with status 201
    - Sets Location header (optional)
    - Serializes DTO to JSON response body

---

## 6. Security Considerations

### Authentication & Authorization

- **No authentication required** for this endpoint (public access)
- **Post-registration**: User receives JWT token for subsequent authenticated requests
- Token should be stored securely on client-side (not in localStorage due to XSS risks; prefer httpOnly cookies or secure session storage)

### Password Security

#### Hashing Algorithm

- **Recommended:** BCrypt with work factor of 12-14
- **Alternative:** Argon2id (winner of Password Hashing Competition)
- **Avoid:** SHA-256, MD5, SHA-1 (not designed for password hashing)

#### Implementation Requirements

- Automatic salt generation (handled by BCrypt)
- Salt must be unique per user (BCrypt does this automatically)
- Hash stored in `PasswordHash` field (NVARCHAR(255))
- Never log or expose plain-text passwords

#### Password Policy

- **Current:** Minimum 8 characters
- **Future Enhancements:**
  - Maximum length limit (e.g., 128 characters to prevent DoS)
  - Complexity requirements (uppercase, lowercase, digit, special character)
  - Password strength meter on frontend
  - Common password blacklist (e.g., "password123")

### Username Security

#### Case Sensitivity

- Database constraint: Unique index with case-sensitive collation
- Entity Framework query: Use `==` operator (translates to case-sensitive SQL)
- Prevents confusion: "JohnDoe" ≠ "johndoe"

### JWT Token Security

#### Token Configuration

- **Algorithm:** HS256 (HMAC-SHA256) minimum, prefer RS256 for production
- **Secret Key:**
  - Minimum 256 bits (32 bytes)
  - Stored in secure configuration (Azure Key Vault, AWS Secrets Manager)
  - Never hardcoded or committed to source control
- **Expiration:** 24 hours (configurable)
- **Claims:** Minimal (sub, unique_name) to reduce token size

#### Token Transmission

- Always use HTTPS in production
- Token sent in `Authorization: Bearer {token}` header
- Never send token in URL query parameters (logged in server logs)

## 7. Error Handling

### Exception Types and HTTP Status Codes

| Exception Type               | HTTP Status               | Description               | Example Scenario                         |
| ---------------------------- | ------------------------- | ------------------------- | ---------------------------------------- |
| `ValidationException`        | 400 Bad Request           | Input validation failed   | Password too short, username empty       |
| `DuplicateUsernameException` | 409 Conflict              | Username already exists   | User tries to register existing username |
| `DbUpdateException`          | 500 Internal Server Error | Database operation failed | Database offline, constraint violation   |
| `Exception` (unhandled)      | 500 Internal Server Error | Unexpected error          | Null reference, out of memory            |

### Custom Exception Definitions

#### DuplicateUsernameException

Location: `10xdevs.Application/Exceptions/DuplicateUsernameException.cs`

```csharp
public class DuplicateUsernameException : Exception
{
    public string Username { get; }

    public DuplicateUsernameException(string username)
        : base($"A user with the username '{username}' already exists.")
    {
        Username = username;
    }
}
```

### Global Exception Handler Middleware

Location: `10xdevs.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`

**Responsibilities:**

1. Catch all unhandled exceptions
2. Log exception details with correlation ID
3. Map exceptions to appropriate HTTP status codes
4. Return RFC 7807 ProblemDetails response
5. Never expose stack traces in production

**Implementation Pattern:**

```csharp
public class GlobalExceptionHandlerMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DuplicateUsernameException ex)
        {
            await HandleDuplicateUsernameException(context, ex);
        }
        catch (ValidationException ex)
        {
            await HandleValidationException(context, ex);
        }
        catch (Exception ex)
        {
            await HandleGenericException(context, ex);
        }
    }
}
```

### Validation Error Response Format

**FluentValidation Integration:**

- MediatR ValidationBehavior intercepts commands
- Collects all validation errors
- Throws `ValidationException` with errors dictionary
- Exception handler converts to ProblemDetails format

**Response Structure:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "username": [
      "Username is required",
      "Username must not exceed 50 characters"
    ],
    "password": ["Password must be at least 8 characters long"]
  },
  "traceId": "00-abc123-def456-00"
}
```

### Logging Strategy

#### Log Levels

| Event                      | Log Level   | Details to Log                                         |
| -------------------------- | ----------- | ------------------------------------------------------ |
| Successful registration    | Information | UserId, Username (not password), Timestamp, IP Address |
| Duplicate username attempt | Warning     | Username, IP Address, Timestamp                        |
| Validation failure         | Information | Validation errors, IP Address                          |
| Database error             | Error       | Exception message, Stack trace, CorrelationId          |
| Unexpected error           | Critical    | Full exception, Stack trace, Request details           |

#### Structured Logging Example

```csharp
_logger.LogInformation(
    "User registered successfully. UserId: {UserId}, Username: {Username}",
    user.Id,
    user.Username
);

_logger.LogWarning(
    "Duplicate username registration attempt. Username: {Username}, IP: {IpAddress}",
    command.Username,
    httpContext.Connection.RemoteIpAddress
);
```

## 9. Implementation Steps

### Step 1: Create Service Interfaces and Implementations

**1.1 Create IPasswordHashingService Interface**

File: `10xdevs.Application/Interfaces/IPasswordHashingService.cs`

```csharp
namespace _10xdevs.Application.Interfaces;

public interface IPasswordHashingService
{
    /// <summary>
    /// Hashes a plain-text password using BCrypt with automatic salt generation.
    /// </summary>
    /// <param name="password">Plain-text password to hash</param>
    /// <returns>Hashed password string (60-72 characters)</returns>
    string HashPassword(string password);

    /// <summary>
    /// Verifies that a plain-text password matches a hashed password.
    /// </summary>
    /// <param name="password">Plain-text password to verify</param>
    /// <param name="passwordHash">Previously hashed password</param>
    /// <returns>True if password matches, false otherwise</returns>
    bool VerifyPassword(string password, string passwordHash);
}
```

**1.2 Create PasswordHashingService Implementation**

File: `10xdevs.Infrastructure/Services/PasswordHashingService.cs`

```csharp
using BCrypt.Net;
using _10xdevs.Application.Interfaces;

namespace _10xdevs.Infrastructure.Services;

public class PasswordHashingService : IPasswordHashingService
{
    private const int WorkFactor = 12; // BCrypt cost factor

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        return BCrypt.Net.BCrypt.Verify(password, passwordHash);
    }
}
```

**Dependencies:** Install `BCrypt.Net-Next` NuGet package

```bash
dotnet add package BCrypt.Net-Next
```

**1.3 Create IJwtTokenService Interface**

File: `10xdevs.Application/Interfaces/IJwtTokenService.cs`

```csharp
using System.Security.Claims;

namespace _10xdevs.Application.Interfaces;

public interface IJwtTokenService
{
    /// <summary>
    /// Generates a JWT token for authenticated user.
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="username">Username</param>
    /// <returns>Signed JWT token string</returns>
    string GenerateToken(int userId, string username);

    /// <summary>
    /// Validates and parses a JWT token.
    /// </summary>
    /// <param name="token">JWT token to validate</param>
    /// <returns>ClaimsPrincipal if valid, null if invalid</returns>
    ClaimsPrincipal? ValidateToken(string token);
}
```

**1.4 Create JwtTokenService Implementation**

File: `10xdevs.Infrastructure/Services/JwtTokenService.cs`

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using _10xdevs.Application.Interfaces;

namespace _10xdevs.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        _tokenHandler = new JwtSecurityTokenHandler();
    }

    public string GenerateToken(int userId, string username)
    {
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!);
        var expirationHours = int.Parse(_configuration["Jwt:ExpirationHours"] ?? "24");

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(expirationHours),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            ),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"]
        };

        var token = _tokenHandler.CreateToken(tokenDescriptor);
        return _tokenHandler.WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!);

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = _configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = _configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        try
        {
            var principal = _tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }
}
```

**Dependencies:**

- `Microsoft.IdentityModel.Tokens`
- `System.IdentityModel.Tokens.Jwt`

```bash
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

**1.5 Update appsettings.json**

File: `10xdevs.Api/appsettings.json`

```json
{
  "Jwt": {
    "SecretKey": "your-secret-key-min-256-bits-32-characters-or-more",
    "Issuer": "10xdevs-api",
    "Audience": "10xdevs-client",
    "ExpirationHours": 24
  }
}
```

⚠️ **Important:** Store `SecretKey` in Azure Key Vault or environment variables in production!

---

### Step 2: Create Repository Interface and Implementation

**2.1 Create IUserRepository Interface**

File: `10xdevs.Domain/Interfaces/IUserRepository.cs`

```csharp
using _10xdevs.Domain.Entities;

namespace _10xdevs.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
}
```

**2.1.1 Create IUnitOfWork Interface**

File: `10xdevs.Domain/Interfaces/IUnitOfWork.cs`

```csharp
namespace _10xdevs.Domain.Interfaces;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

**2.2 Create UserRepository Implementation**

File: `10xdevs.Infrastructure/Repositories/UserRepository.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Infrastructure.Data;

namespace _10xdevs.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AnyAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
        return user;
    }
}
```

**2.2.1 Create UnitOfWork Implementation**

File: `10xdevs.Infrastructure/Repositories/UnitOfWork.cs`

```csharp
using _10xdevs.Domain.Interfaces;
using _10xdevs.Infrastructure.Data;

namespace _10xdevs.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
```

---

### Step 3: Create Custom Exception

**3.1 Create DuplicateUsernameException**

File: `10xdevs.Application/Exceptions/DuplicateUsernameException.cs`

```csharp
namespace _10xdevs.Application.Exceptions;

public class DuplicateUsernameException : Exception
{
    public string Username { get; }

    public DuplicateUsernameException(string username)
        : base($"A user with the username '{username}' already exists.")
    {
        Username = username;
    }
}
```

---

### Step 4: Create Command, Validator, and Handler

**4.1 Create RegisterUserCommand**

File: `10xdevs.Application/Commands/Users/RegisterUser/RegisterUserCommand.cs`

```csharp
using MediatR;
using _10xdevs.Application.DTOs.Auth;

namespace _10xdevs.Application.Commands.Users.RegisterUser;

public class RegisterUserCommand : IRequest<RegisterResponseDto>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

**4.2 Create RegisterUserCommandValidator**

File: `10xdevs.Application/Commands/Users/RegisterUser/RegisterUserCommandValidator.cs`

```csharp
using FluentValidation;

namespace _10xdevs.Application.Commands.Users.RegisterUser;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required")
            .MaximumLength(50).WithMessage("Username must not exceed 50 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long");
    }
}
```

**Dependencies:** Install FluentValidation

```bash
dotnet add package FluentValidation
dotnet add package FluentValidation.DependencyInjectionExtensions
```

**4.3 Create RegisterUserCommandHandler**

File: `10xdevs.Application/Commands/Users/RegisterUser/RegisterUserCommandHandler.cs`

```csharp
using MediatR;
using Microsoft.Extensions.Logging;
using _10xdevs.Application.DTOs.Auth;
using _10xdevs.Application.Exceptions;
using _10xdevs.Application.Interfaces;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;

namespace _10xdevs.Application.Commands.Users.RegisterUser;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, RegisterResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<RegisterUserCommandHandler> _logger;

    public RegisterUserCommandHandler(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IPasswordHashingService passwordHashingService,
        IJwtTokenService jwtTokenService,
        ILogger<RegisterUserCommandHandler> logger)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _passwordHashingService = passwordHashingService;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    public async Task<RegisterResponseDto> Handle(
        RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        // Check if username already exists (case-sensitive)
        var usernameExists = await _userRepository.UsernameExistsAsync(
            request.Username,
            cancellationToken);

        if (usernameExists)
        {
            _logger.LogWarning(
                "Registration attempt with existing username: {Username}",
                request.Username);
            throw new DuplicateUsernameException(request.Username);
        }

        // Hash the password
        var passwordHash = _passwordHashingService.HashPassword(request.Password);

        // Create user entity
        var user = new User
        {
            Username = request.Username,
            PasswordHash = passwordHash,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        // Save to database
        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "User registered successfully. UserId: {UserId}, Username: {Username}",
            user.Id,
            user.Username);

        // Generate JWT token
        var token = _jwtTokenService.GenerateToken(user.Id, user.Username);

        // Return response DTO
        return new RegisterResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Token = token,
            CreatedAtUtc = user.CreatedAtUtc
        };
    }
}
```

---

### Step 5: Create MediatR Validation Behavior

**5.1 Create ValidationBehavior**

File: `10xdevs.Application/Behaviors/ValidationBehavior.cs`

```csharp
using FluentValidation;
using MediatR;

namespace _10xdevs.Application.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
        {
            return await next();
        }

        var context = new ValidationContext<TRequest>(request);

        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Any())
        {
            throw new ValidationException(failures);
        }

        return await next();
    }
}
```

---

### Step 6: Create Controller

**6.1 Create AuthController**

File: `10xdevs.Api/Controllers/AuthController.cs`

```csharp
using MediatR;
using Microsoft.AspNetCore.Mvc;
using _10xdevs.Application.Commands.Users.RegisterUser;
using _10xdevs.Application.DTOs.Auth;

namespace _10xdevs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IMediator mediator, ILogger<AuthController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    /// <param name="request">Registration details (username and password)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User details with authentication token</returns>
    /// <response code="201">User registered successfully</response>
    /// <response code="400">Validation failed</response>
    /// <response code="409">Username already exists</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var command = new RegisterUserCommand
        {
            Username = request.Username,
            Password = request.Password
        };

        var response = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            actionName: nameof(Register),
            value: response);
    }
}
```

---

### Step 7: Create Global Exception Handler Middleware

**7.1 Create GlobalExceptionHandlerMiddleware**

File: `10xdevs.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`

```csharp
using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using _10xdevs.Application.Exceptions;

namespace _10xdevs.Api.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DuplicateUsernameException ex)
        {
            await HandleDuplicateUsernameException(context, ex);
        }
        catch (ValidationException ex)
        {
            await HandleValidationException(context, ex);
        }
        catch (Exception ex)
        {
            await HandleGenericException(context, ex);
        }
    }

    private async Task HandleDuplicateUsernameException(
        HttpContext context,
        DuplicateUsernameException ex)
    {
        _logger.LogWarning(ex, "Duplicate username: {Username}", ex.Username);

        var problemDetails = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
            Title = "Username already exists",
            Status = (int)HttpStatusCode.Conflict,
            Detail = ex.Message
        };

        context.Response.StatusCode = (int)HttpStatusCode.Conflict;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
    }

    private async Task HandleValidationException(
        HttpContext context,
        ValidationException ex)
    {
        _logger.LogWarning(ex, "Validation failed");

        var errors = ex.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray()
            );

        var problemDetails = new ValidationProblemDetails(errors)
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = "One or more validation errors occurred.",
            Status = (int)HttpStatusCode.BadRequest
        };

        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
    }

    private async Task HandleGenericException(HttpContext context, Exception ex)
    {
        _logger.LogError(ex, "Unhandled exception occurred");

        var problemDetails = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Title = "An error occurred while processing your request.",
            Status = (int)HttpStatusCode.InternalServerError,
            Detail = _environment.IsDevelopment() ? ex.Message : "Internal server error"
        };

        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
    }
}
```

**7.2 Create Middleware Extension**

File: `10xdevs.Api/Extensions/MiddlewareExtensions.cs`

```csharp
using _10xdevs.Api.Middleware;

namespace _10xdevs.Api.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
    }
}
```

---

### Step 8: Configure Dependency Injection

**8.1 Create Service Registration Extension**

File: `10xdevs.Api/Extensions/ServiceCollectionExtensions.cs`

```csharp
using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using _10xdevs.Application.Behaviors;
using _10xdevs.Application.Interfaces;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Infrastructure.Repositories;
using _10xdevs.Infrastructure.Services;

namespace _10xdevs.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // MediatR
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(Application.AssemblyReference).Assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        // FluentValidation
        services.AddValidatorsFromAssembly(typeof(Application.AssemblyReference).Assembly);

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();

        // Services
        services.AddScoped<IPasswordHashingService, PasswordHashingService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var key = Encoding.UTF8.GetBytes(configuration["Jwt:SecretKey"]!);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = true;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        return services;
    }
}
```

**8.2 Update Program.cs**

File: `10xdevs.Api/Program.cs`

```csharp
using _10xdevs.Api.Extensions;
using _10xdevs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Custom services
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();
builder.Services.AddJwtAuthentication(builder.Configuration);

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Global exception handler (must be early in pipeline)
app.UseGlobalExceptionHandler();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

---

### Step 9: Verify Entity Framework Configuration

**✅ Already Completed**

The `User` entity is already fully configured in the database:

- **ApplicationDbContext** (`10xdevs.Infrastructure/Data/ApplicationDbContext.cs`) - `Users` DbSet is already defined
- **UserConfiguration** - Entity configuration already exists and is applied via `ApplyConfigurationsFromAssembly()`
- **Migration** - Database migration for `Users` table has been created and applied

**Verification Checklist:**

Review the existing configuration to ensure it matches requirements:

1. ✅ `Users` table exists in database
2. ✅ Username column: `NVARCHAR(50)`, `NOT NULL`, case-sensitive collation (`SQL_Latin1_General_CP1_CS_AS`)
3. ✅ Unique index on Username: `UQ_Users_Username`
4. ✅ PasswordHash column: `NVARCHAR(255)`, `NOT NULL`
5. ✅ CreatedAtUtc and UpdatedAtUtc with default `GETUTCDATE()`
6. ✅ Foreign key relationships to Flashcards and FlashcardGenerationEvents

**No action required for this step** - proceed to Step 10.

---

### Step 10: Add Swagger Documentation

**10.1 Configure Swagger in Program.cs**

Update the Swagger configuration to include XML comments and JWT authentication:

```csharp
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "10xdevs API",
        Version = "v1",
        Description = "AI Flashcard Generator REST API"
    });

    // Include XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath);

    // Add JWT authentication to Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
```

**10.2 Enable XML Documentation**

Update `10xdevs.Api.csproj`:

```xml
<PropertyGroup>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
```

---

### Step 11: Testing

**11.1 Manual Testing with Swagger**

1. Start the application:

   ```bash
   cd backend/src/10xdevs.Api
   dotnet run
   ```

2. Navigate to Swagger UI: `https://localhost:7xxx/swagger`

3. Test scenarios:
   - ✅ Valid registration (username "TestUser", password "Password123")
   - ❌ Short password (password "Pass123")
   - ❌ Long username (username with 51 characters)
   - ❌ Duplicate username (register same username twice)

---
