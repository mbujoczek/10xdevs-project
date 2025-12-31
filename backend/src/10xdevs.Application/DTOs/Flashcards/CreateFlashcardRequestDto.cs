using System.ComponentModel.DataAnnotations;

namespace _10xdevs.Application.DTOs.Flashcards;

public class CreateFlashcardRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Question { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Answer { get; set; } = string.Empty;
}
