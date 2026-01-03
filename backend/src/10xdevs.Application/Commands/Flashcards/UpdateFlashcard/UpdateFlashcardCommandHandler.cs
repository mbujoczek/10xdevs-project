using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;
using _10xdevs.Domain.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Commands.Flashcards.UpdateFlashcard;

public class UpdateFlashcardCommandHandler : IRequestHandler<UpdateFlashcardCommand, FlashcardDto>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateFlashcardCommandHandler> _logger;

    public UpdateFlashcardCommandHandler(
        IFlashcardRepository flashcardRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<UpdateFlashcardCommandHandler> logger)
    {
        _flashcardRepository = flashcardRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FlashcardDto> Handle(
        UpdateFlashcardCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Updating flashcard {FlashcardId} for UserId: {UserId}",
            request.FlashcardId, request.UserId);

        var flashcard = await _flashcardRepository.GetByIdAsync(
            request.FlashcardId,
            request.UserId,
            cancellationToken);

        if (flashcard == null)
        {
            _logger.LogWarning(
                "Flashcard {FlashcardId} not found for UserId: {UserId}",
                request.FlashcardId, request.UserId);

            throw new NotFoundException(
                $"Flashcard with ID {request.FlashcardId} was not found.");
        }

        flashcard.Question = request.Question.Trim();
        flashcard.Answer = request.Answer.Trim();

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Successfully updated flashcard {FlashcardId} for UserId: {UserId}",
            request.FlashcardId, request.UserId);

        return _mapper.Map<FlashcardDto>(flashcard);
    }
}
