using System.ComponentModel.DataAnnotations;

namespace _10xdevs.Application.DTOs.Flashcards;

public class FlashcardCandidateDto
{
    [Required]
    [MaxLength(50)]
    public string CandidateId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Question { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Answer { get; set; } = string.Empty;
}
