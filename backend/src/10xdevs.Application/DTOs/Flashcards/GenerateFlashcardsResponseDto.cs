namespace _10xdevs.Application.DTOs.Flashcards;

public class GenerateFlashcardsResponseDto
{
    public int GenerationEventId { get; set; }
    public List<FlashcardCandidateDto> Candidates { get; set; } = [];
    public int CadidatesCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
