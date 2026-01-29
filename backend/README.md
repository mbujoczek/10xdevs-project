# AI Flashcard Generator - Backend

Backend application built with .NET 8 following Clean Architecture principles.

## Recommended IDE Setup

- [Visual Studio 2022](https://visualstudio.microsoft.com/vs/)
- [VS Code](https://code.visualstudio.com/) + [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit)

## Project Structure

```
backend/
├── src/
│   ├── 10xdevs.Api/             # Presentation Layer (Web API)
│   ├── 10xdevs.Application/     # Application Layer (CQRS with MediatR)
│   ├── 10xdevs.Domain/          # Domain Layer (Entities, Value Objects)
│   └── 10xdevs.Infrastructure/  # Infrastructure Layer (Data Access, External Services)
├── tests/
│   ├── 10xdevs.Domain.Tests/
│   ├── 10xdevs.Application.Tests/
│   └── 10xdevs.Infrastructure.Tests/
└── 10xdevs.sln                  # Solution file
```

## Architecture

The project follows Clean Architecture with the CQRS pattern:

- **Domain Layer**: Core business logic, entities, value objects, domain interfaces
- **Application Layer**: Use cases implemented as Commands and Queries using MediatR
- **Infrastructure Layer**: Database access with Entity Framework Core, external service integrations
- **API Layer**: REST API controllers, middleware, filters

## Technology Stack

- .NET 8
- Entity Framework Core 8
- MediatR 12
- SQL Server
- Swagger/OpenAPI
- OpenRouter API (Cloud-based LLM)

## Prerequisites

Before running the application, ensure you have:

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server](https://www.microsoft.com/sql-server) (LocalDB or full instance)
- [OpenRouter API Key](https://openrouter.ai/) - Sign up to get your API key

## Project Setup

### Restore Dependencies

```sh
dotnet restore 10xdevs.sln
```

### Configure Database

1. Update the connection string in `src/10xdevs.Api/appsettings.json`:

   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Data Source=YOUR_SERVER; Initial Catalog=10xdevsProject; Trusted_Connection=True; TrustServerCertificate=True; MultipleActiveResultSets=True;"
   }
   ```

2. **Database migrations are applied automatically** when the application starts (see `Program.cs`). However, if you want to apply migrations manually without starting the app:
   ```sh
   dotnet ef database update --project src/10xdevs.Infrastructure --startup-project src/10xdevs.Api
   ```

### Configure Application Settings

Update `src/10xdevs.Api/appsettings.json` with your settings:

```json
{
  "Jwt": {
    "SecretKey": "your-secret-key-at-least-32-characters-long",
    "Issuer": "10xdevs.Api",
    "Audience": "10xdevs.Client",
    "ExpirationHours": "24"
  },
  "OpenRouter": {
    "BaseUrl": "https://openrouter.ai/api/v1/",
    "Referer": "http://localhost:5173"
  }
}
```

**Configuration Options:**

- `OpenRouter:BaseUrl` - OpenRouter API base URL (default: https://openrouter.ai/api/v1/)
- `OpenRouter:Referer` - Your application URL (optional but recommended)

**Setting up API Key:**

For development, use .NET User Secrets to securely store your API key:

```sh
dotnet user-secrets set "OpenRouter:ApiKey" "sk-or-v1-YOUR-API-KEY-HERE" --project src/10xdevs.Api
```

### Run for Development

```sh
dotnet run --project src/10xdevs.Api
```

The API will be available at:

- HTTPS: `https://localhost:5020`
- HTTP: `http://localhost:5019`
- Swagger UI: `http://localhost:5019/swagger` or `https://localhost:5020/swagger`

### Build for Production

```sh
dotnet publish 10xdevs.sln -c Release -o ./publish
```

### Code Formatting

```sh
dotnet format 10xdevs.sln
```

## Development Guidelines

- Commands go in `Application/Commands/`
- Queries go in `Application/Queries/`
- Entity configurations go in `Infrastructure/Data/Configurations/`
- Domain entities go in `Domain/Entities/`

## Unit Testing

The project includes comprehensive unit tests for all layers following best practices.

### Test Projects Structure

- **10xdevs.Domain.Tests**: Tests for domain entities, value objects, and business rules
- **10xdevs.Application.Tests**: Tests for CQRS command and query handlers
- **10xdevs.Infrastructure.Tests**: Tests for repository implementations and external services

### Testing Stack

- **Test Framework**: xUnit
- **Assertion Library**: FluentAssertions (for readable assertions)
- **Mocking Library**: NSubstitute (for creating test doubles)

### Running Tests

**Run all tests:**

```sh
dotnet test
```

**Run tests for specific project:**

```sh
dotnet test tests/10xdevs.Domain.Tests
dotnet test tests/10xdevs.Application.Tests
dotnet test tests/10xdevs.Infrastructure.Tests
```

**Run with coverage:**

```sh
dotnet test --collect:"XPlat Code Coverage"
```

**Run in watch mode (during development):**

```sh
dotnet watch test --project tests/10xdevs.Domain.Tests
```

### Test Naming Conventions

- **Test Classes**: `{ClassName}Tests` (e.g., `UserTests`, `CreateUserCommandHandlerTests`)
- **Test Methods**: `{MethodName}_Should{ExpectedBehavior}_When{Condition}`
- **Pattern**: Arrange-Act-Assert (AAA)

### Example Test

```csharp
using FluentAssertions;
using NSubstitute;

public class CreateUserCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldCreateUser_WhenValidCommandProvided()
    {
        // Arrange
        var repository = Substitute.For<IUserRepository>();
        var handler = new CreateUserCommandHandler(repository);
        var command = new CreateUserCommand("user@example.com", "username");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        await repository.Received(1).AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
    }
}
```

## Troubleshooting

### OpenRouter API Issues

**Problem**: API returns 503 Service Unavailable when generating flashcards

**Solutions**:

1. Verify your API key is correctly configured in user secrets
2. Check OpenRouter API status at [https://openrouter.ai/status](https://openrouter.ai/status)
3. Ensure you have sufficient credits in your OpenRouter account
4. Review application logs for detailed error messages
5. Verify network connectivity and firewall settings

**Problem**: 401 Unauthorized error

**Solution**: Your API key is invalid or expired. Generate a new one at [https://openrouter.ai/keys](https://openrouter.ai/keys)
