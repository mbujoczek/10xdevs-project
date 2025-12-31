namespace _10xdevs.Application.DTOs.Flashcards;

public class ListFlashcardsResponseDto
{
    public List<FlashcardDto> Flashcards { get; set; } = [];
    public int TotalCount { get; set; }
}
