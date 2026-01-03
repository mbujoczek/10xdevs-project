using _10xdevs.Domain.ValueObjects;

namespace _10xdevs.Domain.Interfaces;

public interface ISpacedRepetitionService
{
    SRSCalculationResult CalculateNextReview(
        decimal currentEaseFactor,
        int currentRepetitions,
        int grade,
        DateTime reviewDate);
}
