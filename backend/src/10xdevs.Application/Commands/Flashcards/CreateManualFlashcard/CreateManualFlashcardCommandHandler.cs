using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Commands.Flashcards.CreateManualFlashcard;

public class CreateManualFlashcardCommandHandler : IRequestHandler<CreateManualFlashcardCommand, FlashcardDto>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateManualFlashcardCommandHandler> _logger;

    public CreateManualFlashcardCommandHandler(
        IFlashcardRepository flashcardRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<CreateManualFlashcardCommandHandler> logger)
    {
        _flashcardRepository = flashcardRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FlashcardDto> Handle(
        CreateManualFlashcardCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Creating manual flashcard for UserId: {UserId}",
            request.UserId);

        var now = DateTime.UtcNow;

        var flashcard = new Flashcard
        {
            UserId = request.UserId,
            Question = request.Question.Trim(),
            Answer = request.Answer.Trim(),
            Source = FlashcardSource.Manual,
            Status = FlashcardStatus.NotApplicable,
            SRSRepetitions = 0,
            SRSEaseFactor = 2.5m,
            SRSInterval = null,
            SRSNextRepetitionDate = null,
            SRSLastGrade = null,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        var createdFlashcard = await _flashcardRepository.CreateAsync(flashcard, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Successfully created manual flashcard. FlashcardId: {FlashcardId}, UserId: {UserId}",
            createdFlashcard.Id, request.UserId);

        return _mapper.Map<FlashcardDto>(createdFlashcard);
    }
}
