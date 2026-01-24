using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;
using _10xdevs.Domain.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Queries.Flashcards.GetFlashcardById;

public class GetFlashcardByIdQueryHandler : IRequestHandler<GetFlashcardByIdQuery, FlashcardDto>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetFlashcardByIdQueryHandler> _logger;

    public GetFlashcardByIdQueryHandler(
        IFlashcardRepository flashcardRepository,
        IMapper mapper,
        ILogger<GetFlashcardByIdQueryHandler> logger)
    {
        _flashcardRepository = flashcardRepository ?? throw new ArgumentNullException(nameof(flashcardRepository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<FlashcardDto> Handle(
        GetFlashcardByIdQuery request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Retrieving flashcard {FlashcardId} for user {UserId}",
            request.FlashcardId, request.UserId);

        var flashcard = await _flashcardRepository.GetByIdAsync(
            request.FlashcardId,
            request.UserId,
            cancellationToken);

        if (flashcard == null)
        {
            _logger.LogWarning(
                "Flashcard {FlashcardId} not found for user {UserId}",
                request.FlashcardId, request.UserId);

            throw new NotFoundException($"Flashcard with ID {request.FlashcardId} was not found.");
        }

        return _mapper.Map<FlashcardDto>(flashcard);
    }
}
