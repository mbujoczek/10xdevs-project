using _10xdevs.Domain.Enums;

namespace _10xdevs.Application.DTOs.Flashcards;

public class FlashcardDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public FlashcardSource Source { get; set; }
    public FlashcardStatus Status { get; set; }
    public int? SRSInterval { get; set; }
    public int? SRSRepetitions { get; set; }
    public decimal? SRSEaseFactor { get; set; }
    public DateTime? SRSNextRepetitionDate { get; set; }
    public SRSGrade? SRSLastGrade { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
