namespace _10xdevs.Domain.ValueObjects;

public sealed record SRSCalculationResult
{
    public int Interval { get; init; }
    public int Repetitions { get; init; }
    public decimal EaseFactor { get; init; }
    public DateTime NextRepetitionDate { get; init; }
}
