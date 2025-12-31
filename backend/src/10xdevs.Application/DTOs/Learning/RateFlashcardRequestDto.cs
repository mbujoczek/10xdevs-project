using _10xdevs.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace _10xdevs.Application.DTOs.Learning;

public class RateFlashcardRequestDto
{
    [Required]
    public SRSGrade Grade { get; set; }

    public DateTime? ReviewedAtUtc { get; set; }
}
