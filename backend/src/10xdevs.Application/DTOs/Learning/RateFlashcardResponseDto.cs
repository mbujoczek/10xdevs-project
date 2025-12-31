using _10xdevs.Domain.Enums;

namespace _10xdevs.Application.DTOs.Learning;

public class RateFlashcardResponseDto
{
    public int Id { get; set; }
    public int SRSInterval { get; set; }
    public int SRSRepetitions { get; set; }
    public decimal SRSEaseFactor { get; set; }
    public DateTime SRSNextRepetitionDate { get; set; }
    public SRSGrade SRSLastGrade { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
