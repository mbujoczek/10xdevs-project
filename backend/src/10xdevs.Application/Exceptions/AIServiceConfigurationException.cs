namespace _10xdevs.Application.Exceptions;

/// <summary>
/// Exception thrown when the AI service configuration is invalid.
/// Results in HTTP 500 Internal Server Error response.
/// </summary>
public class AIServiceConfigurationException : Exception
{
    public AIServiceConfigurationException()
        : base("The AI service is not properly configured.")
    {
    }

    public AIServiceConfigurationException(string message)
        : base(message)
    {
    }

    public AIServiceConfigurationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
