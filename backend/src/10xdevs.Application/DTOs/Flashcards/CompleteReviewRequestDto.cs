using System.ComponentModel.DataAnnotations;

namespace _10xdevs.Application.DTOs.Flashcards;

public class CompleteReviewRequestDto
{
    [Required]
    public List<FlashcardCandidateDto> Accepted { get; set; } = [];

    [Required]
    public List<FlashcardCandidateDto> Edited { get; set; } = [];
}
