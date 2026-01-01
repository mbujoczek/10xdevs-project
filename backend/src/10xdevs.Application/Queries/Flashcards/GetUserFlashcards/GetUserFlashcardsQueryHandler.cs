using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Domain.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Queries.Flashcards.GetUserFlashcards;

public class GetUserFlashcardsQueryHandler : IRequestHandler<GetUserFlashcardsQuery, ListFlashcardsResponseDto>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetUserFlashcardsQueryHandler> _logger;

    public GetUserFlashcardsQueryHandler(
        IFlashcardRepository flashcardRepository,
        IMapper mapper,
        ILogger<GetUserFlashcardsQueryHandler> logger)
    {
        _flashcardRepository = flashcardRepository ?? throw new ArgumentNullException(nameof(flashcardRepository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ListFlashcardsResponseDto> Handle(
        GetUserFlashcardsQuery request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Retrieving flashcards for user {UserId} with status filter {StatusFilter} and source filter {SourceFilter}",
            request.UserId,
            request.StatusFilter != null ? string.Join(", ", request.StatusFilter) : "none",
            request.SourceFilter?.ToString() ?? "none");

        try
        {
            var flashcards = await _flashcardRepository.GetByUserIdAsync(
                request.UserId,
                request.StatusFilter,
                request.SourceFilter,
                cancellationToken);

            var flashcardDtos = _mapper.Map<List<FlashcardDto>>(flashcards);

            var response = new ListFlashcardsResponseDto
            {
                Flashcards = flashcardDtos,
                TotalCount = flashcardDtos.Count
            };

            _logger.LogInformation(
                "Successfully retrieved {Count} flashcards for user {UserId}",
                response.TotalCount, request.UserId);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to retrieve flashcards for user {UserId}",
                request.UserId);
            throw;
        }
    }
}
