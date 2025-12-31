using _10xdevs.Domain.Entities;

namespace _10xdevs.Domain.Interfaces;

public interface IFlashcardRepository
{
    Task<Flashcard> CreateAsync(
        Flashcard flashcard,
        CancellationToken cancellationToken = default);

    Task<List<Flashcard>> CreateRangeAsync(
        List<Flashcard> flashcards,
        CancellationToken cancellationToken = default);
}
