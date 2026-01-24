# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/10xdevs.Api/10xdevs.Api.csproj", "src/10xdevs.Api/"]
COPY ["src/10xdevs.Application/10xdevs.Application.csproj", "src/10xdevs.Application/"]
COPY ["src/10xdevs.Domain/10xdevs.Domain.csproj", "src/10xdevs.Domain/"]
COPY ["src/10xdevs.Infrastructure/10xdevs.Infrastructure.csproj", "src/10xdevs.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/10xdevs.Api/10xdevs.Api.csproj"

# Copy all source code
COPY . .

# Build and publish
WORKDIR "/src/src/10xdevs.Api"
RUN dotnet publish "10xdevs.Api.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published files from build stage
COPY --from=build /app/publish .

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Configure application to listen on 0.0.0.0:8080
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set entry point
ENTRYPOINT ["dotnet", "10xdevs.Api.dll"]
