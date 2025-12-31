using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace _10xdevs.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for managing FlashcardGenerationEvent entities.
/// </summary>
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

        // Set timestamps
        var utcNow = DateTime.UtcNow;
        generationEvent.CreatedAtUtc = utcNow;
        generationEvent.UpdatedAtUtc = utcNow;

        // Add entity to context
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

        // Update timestamp
        generationEvent.UpdatedAtUtc = DateTime.UtcNow;

        // Update entity in context
        _context.FlashcardGenerationEvents.Update(generationEvent);

        return Task.CompletedTask;
    }
}
