using _10xdevs.Domain.Interfaces;
using _10xdevs.Domain.ValueObjects;

namespace _10xdevs.Infrastructure.Services;

public sealed class SpacedRepetitionService : ISpacedRepetitionService
{
    private const decimal MinEaseFactor = 1.3m;
    private const decimal MaxEaseFactor = 2.5m;

    public SRSCalculationResult CalculateNextReview(
        decimal currentEaseFactor,
        int currentRepetitions,
        int grade,
        DateTime reviewDate)
    {
        var newEaseFactor = CalculateEaseFactor(currentEaseFactor, grade);

        if (grade < 3)
        {
            return new SRSCalculationResult
            {
                Interval = 1,
                Repetitions = 0,
                EaseFactor = newEaseFactor,
                NextRepetitionDate = reviewDate.AddDays(1)
            };
        }

        var newRepetitions = currentRepetitions + 1;
        var interval = CalculateInterval(newRepetitions, newEaseFactor);

        return new SRSCalculationResult
        {
            Interval = interval,
            Repetitions = newRepetitions,
            EaseFactor = newEaseFactor,
            NextRepetitionDate = reviewDate.AddDays(interval)
        };
    }

    private static decimal CalculateEaseFactor(decimal currentEaseFactor, int grade)
    {
        var newEaseFactor = currentEaseFactor + (0.1m - (5 - grade) * (0.08m + (5 - grade) * 0.02m));

        if (newEaseFactor < MinEaseFactor)
            return MinEaseFactor;

        if (newEaseFactor > MaxEaseFactor)
            return MaxEaseFactor;

        return Math.Round(newEaseFactor, 2);
    }

    private static int CalculateInterval(int repetitions, decimal easeFactor)
    {
        return repetitions switch
        {
            0 => 1,
            1 => 6,
            _ => (int)Math.Round((repetitions - 1) * 6 * (double)easeFactor)
        };
    }
}
