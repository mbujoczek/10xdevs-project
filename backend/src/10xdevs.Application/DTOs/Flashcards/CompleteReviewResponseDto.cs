namespace _10xdevs.Application.DTOs.Flashcards;

public class CompleteReviewResponseDto
{
    public int SavedFlashcardsCount { get; set; }
    public int AcceptedCount { get; set; }
    public int EditedCount { get; set; }
    public int RejectedCount { get; set; }
    public List<int> FlashcardIds { get; set; } = [];
}
