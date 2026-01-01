using _10xdevs.Application.DTOs.Flashcards;
using MediatR;

namespace _10xdevs.Application.Commands.Flashcards.CreateManualFlashcard;

public record CreateManualFlashcardCommand(
    int UserId,
    string Question,
    string Answer
) : IRequest<FlashcardDto>;
