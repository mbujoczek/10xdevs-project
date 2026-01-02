using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Application.Exceptions;
using _10xdevs.Domain.Interfaces;
using AutoMapper;
using MediatR;

namespace _10xdevs.Application.Commands.Learning.RateFlashcard;

public sealed class RateFlashcardCommandHandler
    : IRequestHandler<RateFlashcardCommand, RateFlashcardResponseDto>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly ISpacedRepetitionService _spacedRepetitionService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public RateFlashcardCommandHandler(
        IFlashcardRepository flashcardRepository,
        ISpacedRepetitionService spacedRepetitionService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _flashcardRepository = flashcardRepository;
        _spacedRepetitionService = spacedRepetitionService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<RateFlashcardResponseDto> Handle(
        RateFlashcardCommand request,
        CancellationToken cancellationToken)
    {
        var flashcard = await _flashcardRepository.GetByIdAsync(
            request.FlashcardId,
            request.UserId,
            cancellationToken);

        if (flashcard == null)
        {
            throw new NotFoundException($"Flashcard with ID {request.FlashcardId} not found");
        }

        var srsResult = _spacedRepetitionService.CalculateNextReview(
            currentEaseFactor: flashcard.SRSEaseFactor ?? 2.5m,
            currentRepetitions: flashcard.SRSRepetitions ?? 0,
            grade: (int)request.Grade,
            reviewDate: DateTime.UtcNow);

        flashcard.UpdateSRSParameters(
            interval: srsResult.Interval,
            repetitions: srsResult.Repetitions,
            easeFactor: srsResult.EaseFactor,
            nextRepetitionDate: srsResult.NextRepetitionDate,
            lastGrade: request.Grade);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<RateFlashcardResponseDto>(flashcard);
    }
}
