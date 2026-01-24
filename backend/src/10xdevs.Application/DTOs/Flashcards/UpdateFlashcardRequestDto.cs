using System.ComponentModel.DataAnnotations;

namespace _10xdevs.Application.DTOs.Flashcards;

public class UpdateFlashcardRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Question { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Answer { get; set; } = string.Empty;
}
