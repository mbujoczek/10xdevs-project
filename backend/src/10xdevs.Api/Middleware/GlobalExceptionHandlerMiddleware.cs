using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using _10xdevs.Application.Exceptions;

namespace _10xdevs.Api.Middleware;

/// <summary>
/// Global exception handling middleware that catches all unhandled exceptions
/// and converts them to appropriate HTTP responses with ProblemDetails format.
/// </summary>
public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IWebHostEnvironment environment)
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
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;

        _logger.LogError(
            exception,
            "An error occurred. TraceId: {TraceId}, Path: {Path}",
            traceId,
            context.Request.Path);

        var problemDetails = exception switch
        {
            ValidationException validationException => CreateValidationProblemDetails(
                context, validationException, traceId),

            DuplicateUsernameException duplicateUsernameException => CreateProblemDetails(
                context,
                HttpStatusCode.Conflict,
                "Username Already Exists",
                duplicateUsernameException.Message,
                traceId),

            InvalidCredentialsException invalidCredentialsException => CreateProblemDetails(
                context,
                HttpStatusCode.Unauthorized,
                "Invalid Credentials",
                invalidCredentialsException.Message,
                traceId),

            AIServiceUnavailableException aiServiceException => CreateProblemDetails(
                context,
                HttpStatusCode.ServiceUnavailable,
                "AI Service Unavailable",
                "The AI flashcard generation service is currently unavailable. Please try again later.",
                traceId),

            _ => CreateProblemDetails(
                context,
                HttpStatusCode.InternalServerError,
                "Internal Server Error",
                _environment.IsDevelopment()
                    ? exception.Message
                    : "An unexpected error occurred. Please try again later.",
                traceId)
        };

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
    }

    private static ProblemDetails CreateValidationProblemDetails(
        HttpContext context,
        ValidationException exception,
        string traceId)
    {
        var errors = exception.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());

        return new ValidationProblemDetails(errors)
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = "Validation Failed",
            Status = (int)HttpStatusCode.BadRequest,
            Detail = "One or more validation errors occurred.",
            Instance = context.Request.Path,
            Extensions = { ["traceId"] = traceId }
        };
    }

    private static ProblemDetails CreateProblemDetails(
        HttpContext context,
        HttpStatusCode statusCode,
        string title,
        string detail,
        string traceId)
    {
        var type = statusCode switch
        {
            HttpStatusCode.BadRequest => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            HttpStatusCode.Unauthorized => "https://tools.ietf.org/html/rfc7235#section-3.1",
            HttpStatusCode.Conflict => "https://tools.ietf.org/html/rfc7231#section-6.5.8",
            HttpStatusCode.ServiceUnavailable => "https://tools.ietf.org/html/rfc7231#section-6.6.4",
            HttpStatusCode.InternalServerError => "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            _ => "https://tools.ietf.org/html/rfc7231"
        };

        return new ProblemDetails
        {
            Type = type,
            Title = title,
            Status = (int)statusCode,
            Detail = detail,
            Instance = context.Request.Path,
            Extensions = { ["traceId"] = traceId }
        };
    }
}
