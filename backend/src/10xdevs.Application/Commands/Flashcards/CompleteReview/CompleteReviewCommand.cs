using _10xdevs.Application.DTOs.Flashcards;
using MediatR;

namespace _10xdevs.Application.Commands.Flashcards.CompleteReview;

public record CompleteReviewCommand(
    int EventId,
    int UserId,
    CompleteReviewRequestDto Request
) : IRequest<CompleteReviewResponseDto>;
