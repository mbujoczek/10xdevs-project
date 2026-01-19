using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using _10xdevs.Application.Interfaces;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Infrastructure.Repositories;
using _10xdevs.Infrastructure.Services;

namespace _10xdevs.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Register repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IFlashcardGenerationEventRepository, FlashcardGenerationEventRepository>();
        services.AddScoped<IFlashcardRepository, FlashcardRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register services
        services.AddSingleton<IPasswordHashingService, PasswordHashingService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ISpacedRepetitionService, SpacedRepetitionService>();

        // Register AI service with HttpClient for OpenRouter
        services.AddHttpClient<IFlashcardAIService, OpenRouterService>((serviceProvider, client) =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var baseUrl = configuration["OpenRouter:BaseUrl"]
                ?? throw new InvalidOperationException("OpenRouter:BaseUrl is not configured in appsettings.json");
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout = TimeSpan.FromSeconds(120);
        })
        .SetHandlerLifetime(TimeSpan.FromMinutes(5)); // Connection pooling optimization

        return services;
    }
}
