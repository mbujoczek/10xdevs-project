namespace _10xdevs.Domain.Entities;

public class FlashcardGenerationEvent
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CandidatesCount { get; set; }
    public int AcceptedCount { get; set; }
    public int EditedCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public User User { get; set; } = null!;
}
