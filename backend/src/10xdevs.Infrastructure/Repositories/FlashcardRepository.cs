using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Infrastructure.Data;

namespace _10xdevs.Infrastructure.Repositories;

public class FlashcardRepository : IFlashcardRepository
{
    private readonly ApplicationDbContext _context;

    public FlashcardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Flashcard> CreateAsync(
        Flashcard flashcard,
        CancellationToken cancellationToken = default)
    {
        await _context.Flashcards.AddAsync(flashcard, cancellationToken);
        return flashcard;
    }

    public async Task<List<Flashcard>> CreateRangeAsync(
        List<Flashcard> flashcards,
        CancellationToken cancellationToken = default)
    {
        await _context.Flashcards.AddRangeAsync(flashcards, cancellationToken);
        return flashcards;
    }
}
