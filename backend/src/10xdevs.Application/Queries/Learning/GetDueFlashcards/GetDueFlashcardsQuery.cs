using _10xdevs.Application.DTOs.Learning;
using MediatR;

namespace _10xdevs.Application.Queries.Learning.GetDueFlashcards;

public sealed record GetDueFlashcardsQuery(int UserId) : IRequest<DueFlashcardsResponseDto>;
