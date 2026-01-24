namespace _10xdevs.Application.DTOs.Statistics;

public class GenerationAcceptanceResponseDto
{
    public int TotalCandidates { get; set; }
    public int AcceptedWithoutEditing { get; set; }
    public int AcceptedAfterEditing { get; set; }
    public int Rejected { get; set; }
    public decimal AcceptanceRate { get; set; }
    public decimal PureAcceptanceRate { get; set; }
    public bool MeetsSuccessMetric { get; set; }
    public decimal TargetRate { get; set; }
}
