using MediatR;

namespace _10xdevs.Application.Commands.Flashcards.DeleteFlashcard;

public record DeleteFlashcardCommand(
    int FlashcardId,
    int UserId
) : IRequest<Unit>;
