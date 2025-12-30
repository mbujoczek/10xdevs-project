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

## Project Setup

### Restore Dependencies

```sh
dotnet restore 10xdevs.sln
```

### Configure Database

1.  Update the connection string in `src/10xdevs.Api/appsettings.json`.
2.  Run database migrations:

```sh
dotnet ef database update --project src/10xdevs.Infrastructure --startup-project src/10xdevs.Api
```

### Run for Development

```sh
dotnet run --project src/10xdevs.Api
```

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
