using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Domain.Enums;
using MediatR;

namespace _10xdevs.Application.Queries.Flashcards.GetUserFlashcards;

public class GetUserFlashcardsQuery : IRequest<ListFlashcardsResponseDto>
{
    public int UserId { get; set; }
    public List<FlashcardStatus>? StatusFilter { get; set; }
    public FlashcardSource? SourceFilter { get; set; }
}
