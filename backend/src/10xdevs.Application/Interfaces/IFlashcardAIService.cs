using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;

namespace _10xdevs.Application.Interfaces;

/// <summary>
/// Service interface for AI-powered flashcard generation.
/// </summary>
public interface IFlashcardAIService
{
    /// <summary>
    /// Generates flashcard candidates from input text using AI model.
    /// Requests exactly 5 flashcards in the specified language.
    /// </summary>
    /// <param name="inputText">The text content from which flashcards will be generated</param>
    /// <param name="language">The language for generated flashcards ('pl' or 'en')</param>
    /// <param name="cancellationToken">Cancellation token for async operation</param>
    /// <returns>List of flashcard candidates with questions and answers</returns>
    /// <exception cref="AIServiceUnavailableException">Thrown when AI service is unavailable or returns an error</exception>
    Task<List<FlashcardCandidateDto>> GenerateFlashcardsAsync(
        string inputText,
        string language,
        CancellationToken cancellationToken = default);
}
