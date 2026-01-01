using _10xdevs.Application.Exceptions;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Commands.Flashcards.DeleteFlashcard;

public class DeleteFlashcardCommandHandler : IRequestHandler<DeleteFlashcardCommand, Unit>
{
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteFlashcardCommandHandler> _logger;

    public DeleteFlashcardCommandHandler(
        IFlashcardRepository flashcardRepository,
        IUnitOfWork unitOfWork,
        ILogger<DeleteFlashcardCommandHandler> logger)
    {
        _flashcardRepository = flashcardRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(
        DeleteFlashcardCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Soft deleting flashcard {FlashcardId} for UserId: {UserId}",
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

        flashcard.Status = FlashcardStatus.Deleted;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Successfully soft deleted flashcard {FlashcardId} for UserId: {UserId}",
            request.FlashcardId, request.UserId);

        return Unit.Value;
    }
}
