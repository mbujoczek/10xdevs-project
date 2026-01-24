using _10xdevs.Domain.Entities;
using _10xdevs.Domain.ValueObjects;

namespace _10xdevs.Domain.Interfaces;

public interface IFlashcardGenerationEventRepository
{
    Task<FlashcardGenerationEvent> CreateAsync(
        FlashcardGenerationEvent generationEvent,
        CancellationToken cancellationToken = default);

    Task<FlashcardGenerationEvent?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task UpdateAsync(
        FlashcardGenerationEvent generationEvent,
        CancellationToken cancellationToken = default);

    Task<GlobalGenerationStatistics> GetGlobalStatisticsAsync(
        CancellationToken cancellationToken = default);
}
