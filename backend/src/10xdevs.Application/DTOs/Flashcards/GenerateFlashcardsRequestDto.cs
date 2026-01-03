using System.ComponentModel.DataAnnotations;

namespace _10xdevs.Application.DTOs.Flashcards;

public class GenerateFlashcardsRequestDto
{
    [Required]
    [MaxLength(10000)]
    public string InputText { get; set; } = string.Empty;

    [RegularExpression("^(pl|en)$")]
    public string? Language { get; set; } = "en";
}
