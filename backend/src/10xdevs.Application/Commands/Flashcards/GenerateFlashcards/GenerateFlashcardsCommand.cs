using _10xdevs.Application.DTOs.Flashcards;
using MediatR;

namespace _10xdevs.Application.Commands.Flashcards.GenerateFlashcards;

/// <summary>
/// Command to generate flashcard candidates from input text using AI.
/// </summary>
public class GenerateFlashcardsCommand : IRequest<GenerateFlashcardsResponseDto>
{
    /// <summary>
    /// User identifier from JWT token.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Input text from which flashcards will be generated.
    /// </summary>
    public string InputText { get; set; } = string.Empty;

    /// <summary>
    /// Language for generated flashcards ('pl' or 'en').
    /// </summary>
    public string Language { get; set; } = "en";
}
