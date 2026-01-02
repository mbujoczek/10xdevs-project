using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Domain.Enums;
using MediatR;

namespace _10xdevs.Application.Commands.Learning.RateFlashcard;

public sealed record RateFlashcardCommand(
    int FlashcardId,
    int UserId,
    SRSGrade Grade) : IRequest<RateFlashcardResponseDto>;
