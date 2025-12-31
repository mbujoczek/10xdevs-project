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
- Ollama (Local LLM - Phi3)

## Prerequisites

Before running the application, ensure you have:

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server](https://www.microsoft.com/sql-server) (LocalDB or full instance)
- [Ollama](https://ollama.ai/) installed and running locally

### Ollama Setup

1. **Install Ollama**:

   - Download from [https://ollama.ai/](https://ollama.ai/)
   - Follow installation instructions for your OS

2. **Pull the Phi3 model**:

   ```bash
   ollama pull phi3
   ```

3. **Verify Ollama is running**:

   ```sh
   ollama list
   ```

   Ollama should be accessible at `http://localhost:11434`

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

2. Run database migrations:
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
  "Ollama": {
    "BaseUrl": "http://localhost:11434",
    "Model": "phi3",
    "Timeout": "30"
  }
}
```

**Configuration Options:**

- `Ollama:BaseUrl` - Ollama server address (default: http://localhost:11434)
- `Ollama:Model` - LLM model name (default: phi3)
- `Ollama:Timeout` - Request timeout in seconds (default: 30)

### Run for Development

```sh
dotnet run --project src/10xdevs.Api
```

The API will be available at:

- HTTPS: `https://localhost:7001`
- HTTP: `http://localhost:5001`
- Swagger UI: `https://localhost:7001/swagger`

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

## Troubleshooting

### Ollama Connection Issues

**Problem**: API returns 503 Service Unavailable when generating flashcards

**Solutions**:

1. Verify Ollama is running: `ollama list`
2. Check Ollama is accessible: `curl http://localhost:11434/api/version`
3. Ensure phi3 model is pulled: `ollama pull phi3`
4. Check firewall settings allowing localhost:11434
5. Review logs for detailed error messages
