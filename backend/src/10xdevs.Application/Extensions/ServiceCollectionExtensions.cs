using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using _10xdevs.Application.Behaviors;

namespace _10xdevs.Application.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register FluentValidation validators
        services.AddValidatorsFromAssemblyContaining<AssemblyReference>();

        // Register MediatR pipeline behaviors
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(AssemblyReference).Assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        return services;
    }
}
