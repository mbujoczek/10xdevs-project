using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

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

    public async Task<List<Flashcard>> GetByUserIdAsync(
        int userId,
        List<FlashcardStatus>? statusFilter = null,
        FlashcardSource? sourceFilter = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Flashcards
            .Where(f => f.UserId == userId && f.Status != FlashcardStatus.Deleted);

        if (statusFilter != null && statusFilter.Any())
        {
            query = query.Where(f => statusFilter.Contains(f.Status));
        }

        if (sourceFilter.HasValue)
        {
            query = query.Where(f => f.Source == sourceFilter.Value);
        }

        query = query.OrderByDescending(f => f.CreatedAtUtc);

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Flashcard?> GetByIdAsync(
        int flashcardId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Flashcards
            .Where(f => f.Id == flashcardId
                     && f.UserId == userId
                     && f.Status != FlashcardStatus.Deleted)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
