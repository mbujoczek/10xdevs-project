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

        // Register AI service with HttpClient
        services.AddHttpClient<IFlashcardAIService, FlashcardAIService>((serviceProvider, client) =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var baseUrl = configuration["Ollama:BaseUrl"] ?? "http://localhost:11434";
            var timeout = int.Parse(configuration["Ollama:Timeout"] ?? "240");

            client.BaseAddress = new Uri(baseUrl);
            client.Timeout = TimeSpan.FromSeconds(timeout);
        })
        .SetHandlerLifetime(TimeSpan.FromMinutes(5)); // Connection pooling optimization

        return services;
    }
}
