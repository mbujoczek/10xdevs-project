using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;

namespace _10xdevs.Domain.Interfaces;

public interface IFlashcardRepository
{
    Task<Flashcard> CreateAsync(
        Flashcard flashcard,
        CancellationToken cancellationToken = default);

    Task<List<Flashcard>> CreateRangeAsync(
        List<Flashcard> flashcards,
        CancellationToken cancellationToken = default);

    Task<List<Flashcard>> GetByUserIdAsync(
        int userId,
        List<FlashcardStatus>? statusFilter = null,
        FlashcardSource? sourceFilter = null,
        CancellationToken cancellationToken = default);

    Task<Flashcard?> GetByIdAsync(
        int flashcardId,
        int userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Flashcard>> GetDueFlashcardsAsync(
        int userId,
        CancellationToken cancellationToken = default);
}
