using _10xdevs.Application.DTOs.Flashcards;

namespace _10xdevs.Application.DTOs.Learning;

public class DueFlashcardsResponseDto
{
    public List<FlashcardDto> Flashcards { get; set; } = [];
    public int TotalDueCount { get; set; }
}
