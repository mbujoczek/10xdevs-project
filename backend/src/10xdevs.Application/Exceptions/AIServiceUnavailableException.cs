namespace _10xdevs.Application.Exceptions;

/// <summary>
/// Exception thrown when the AI service (Ollama) is unavailable or returns an error.
/// Results in HTTP 503 Service Unavailable response.
/// </summary>
public class AIServiceUnavailableException : Exception
{
    public AIServiceUnavailableException()
        : base("The AI flashcard generation service is currently unavailable.")
    {
    }

    public AIServiceUnavailableException(string message)
        : base(message)
    {
    }

    public AIServiceUnavailableException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
