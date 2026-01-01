using _10xdevs.Application.DTOs.Flashcards;
using MediatR;

namespace _10xdevs.Application.Commands.Flashcards.UpdateFlashcard;

public record UpdateFlashcardCommand(
    int FlashcardId,
    int UserId,
    string Question,
    string Answer
) : IRequest<FlashcardDto>;
