namespace _10xdevs.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public ICollection<Flashcard> Flashcards { get; set; } = [];
    public ICollection<FlashcardGenerationEvent> FlashcardGenerationEvents { get; set; } = [];
}
