using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Domain.Interfaces;
using AutoMapper;
using MediatR;

namespace _10xdevs.Application.Queries.Learning.GetDueFlashcards;

public sealed class GetDueFlashcardsQueryHandler
    : IRequestHandler<GetDueFlashcardsQuery, DueFlashcardsResponseDto>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IMapper _mapper;

    public GetDueFlashcardsQueryHandler(
        IFlashcardRepository flashcardRepository,
        IMapper mapper)
    {
        _flashcardRepository = flashcardRepository;
        _mapper = mapper;
    }

    public async Task<DueFlashcardsResponseDto> Handle(
        GetDueFlashcardsQuery request,
        CancellationToken cancellationToken)
    {
        var dueFlashcards = await _flashcardRepository.GetDueFlashcardsAsync(
            request.UserId,
            cancellationToken);

        var flashcardDtos = _mapper.Map<List<FlashcardDto>>(dueFlashcards);

        return new DueFlashcardsResponseDto
        {
            Flashcards = flashcardDtos,
            TotalDueCount = flashcardDtos.Count
        };
    }
}
