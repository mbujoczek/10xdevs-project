# 10xdevs Backend

Backend application built with .NET 8 following Clean Architecture principles.

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

## Getting Started

1. Update the connection string in `appsettings.json`
2. Run migrations: `dotnet ef database update --project src/10xdevs.Infrastructure --startup-project src/10xdevs.Api`
3. Run the application: `dotnet run --project src/10xdevs.Api`

## Development

- Commands go in `Application/Commands/`
- Queries go in `Application/Queries/`
- Entity configurations go in `Infrastructure/Data/Configurations/`
- Domain entities go in `Domain/Entities/`
