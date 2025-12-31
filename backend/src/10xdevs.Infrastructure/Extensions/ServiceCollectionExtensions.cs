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
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register services
        services.AddSingleton<IPasswordHashingService, PasswordHashingService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
