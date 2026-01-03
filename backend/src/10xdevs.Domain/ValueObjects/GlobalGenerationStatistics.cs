namespace _10xdevs.Domain.ValueObjects;

public sealed record GlobalGenerationStatistics
{
    public int TotalCandidates { get; init; }
    public int AcceptedCount { get; init; }
    public int EditedCount { get; init; }
}
