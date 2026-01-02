using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Domain.ValueObjects;
using _10xdevs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace _10xdevs.Infrastructure.Repositories;

public class FlashcardGenerationEventRepository : IFlashcardGenerationEventRepository
{
    private readonly ApplicationDbContext _context;

    public FlashcardGenerationEventRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    /// <inheritdoc />
    public async Task<FlashcardGenerationEvent> CreateAsync(
        FlashcardGenerationEvent generationEvent,
        CancellationToken cancellationToken = default)
    {
        if (generationEvent == null)
            throw new ArgumentNullException(nameof(generationEvent));

        var utcNow = DateTime.UtcNow;
        generationEvent.CreatedAtUtc = utcNow;
        generationEvent.UpdatedAtUtc = utcNow;

        await _context.FlashcardGenerationEvents.AddAsync(generationEvent, cancellationToken);

        // Save changes to database
        await _context.SaveChangesAsync(cancellationToken);

        return generationEvent;
    }

    /// <inheritdoc />
    public async Task<FlashcardGenerationEvent?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await _context.FlashcardGenerationEvents
            .FindAsync([id], cancellationToken);
    }

    /// <inheritdoc />
    public Task UpdateAsync(
        FlashcardGenerationEvent generationEvent,
        CancellationToken cancellationToken = default)
    {
        if (generationEvent == null)
            throw new ArgumentNullException(nameof(generationEvent));

        generationEvent.UpdatedAtUtc = DateTime.UtcNow;

        _context.FlashcardGenerationEvents.Update(generationEvent);

        return Task.CompletedTask;
    }

    public async Task<GlobalGenerationStatistics> GetGlobalStatisticsAsync(
        CancellationToken cancellationToken = default)
    {
        var stats = await _context.FlashcardGenerationEvents
            .AsNoTracking()
            .Select(e => new
            {
                e.CandidatesCount,
                e.AcceptedCount,
                e.EditedCount
            })
            .ToListAsync(cancellationToken);

        if (!stats.Any())
        {
            return new GlobalGenerationStatistics
            {
                TotalCandidates = 0,
                AcceptedCount = 0,
                EditedCount = 0
            };
        }

        return new GlobalGenerationStatistics
        {
            TotalCandidates = stats.Sum(s => s.CandidatesCount),
            AcceptedCount = stats.Sum(s => s.AcceptedCount),
            EditedCount = stats.Sum(s => s.EditedCount)
        };
    }
}
