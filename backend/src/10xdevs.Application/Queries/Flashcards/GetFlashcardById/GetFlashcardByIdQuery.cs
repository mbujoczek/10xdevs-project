using _10xdevs.Application.DTOs.Flashcards;
using MediatR;

namespace _10xdevs.Application.Queries.Flashcards.GetFlashcardById;

public class GetFlashcardByIdQuery : IRequest<FlashcardDto>
{
    public int FlashcardId { get; set; }
    public int UserId { get; set; }
}
