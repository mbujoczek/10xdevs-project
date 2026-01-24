using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Commands.Flashcards.CompleteReview;

public class CompleteReviewCommandHandler
    : IRequestHandler<CompleteReviewCommand, CompleteReviewResponseDto>
{
    private readonly IFlashcardGenerationEventRepository _eventRepository;
    private readonly IFlashcardRepository _flashcardRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CompleteReviewCommandHandler> _logger;

    public CompleteReviewCommandHandler(
        IFlashcardGenerationEventRepository eventRepository,
        IFlashcardRepository flashcardRepository,
        IUnitOfWork unitOfWork,
        ILogger<CompleteReviewCommandHandler> logger)
    {
        _eventRepository = eventRepository;
        _flashcardRepository = flashcardRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<CompleteReviewResponseDto> Handle(
        CompleteReviewCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Starting flashcard review completion for EventId: {EventId}, UserId: {UserId}",
            request.EventId, request.UserId);

        // 1. Retrieve generation event - Check if event exists
        var generationEvent = await _eventRepository.GetByIdAsync(
            request.EventId,
            cancellationToken);

        if (generationEvent == null)
        {
            _logger.LogWarning(
                "Generation event not found. EventId: {EventId}, UserId: {UserId}",
                request.EventId, request.UserId);
            throw new NotFoundException(
                $"Generation event with ID {request.EventId} was not found.");
        }

        // 2. Verify ownership
        if (generationEvent.UserId != request.UserId)
        {
            _logger.LogWarning(
                "Forbidden access to generation event. EventId: {EventId}, RequestedBy: {UserId}, Owner: {OwnerId}",
                request.EventId, request.UserId, generationEvent.UserId);
            throw new ForbiddenException(
                "You do not have permission to complete this generation event.");
        }

        // 3. Check if review already completed
        if (generationEvent.AcceptedCount > 0 || generationEvent.EditedCount > 0)
        {
            _logger.LogWarning(
                "Attempted to complete already finished review. EventId: {EventId}, UserId: {UserId}",
                request.EventId, request.UserId);
            throw new ConflictException(
                "The review for this generation event has already been completed.");
        }

        // 4. Validate at least one flashcard is submitted
        var acceptedCount = request.Request.Accepted.Count;
        var editedCount = request.Request.Edited.Count;

        if (acceptedCount == 0 && editedCount == 0)
        {
            _logger.LogWarning(
                "No flashcards submitted for review completion. EventId: {EventId}, UserId: {UserId}",
                request.EventId, request.UserId);
            throw new BadRequestException(
                "At least one flashcard must be submitted (accepted or edited).");
        }

        // 5. Create flashcard entities from accepted candidates
        var flashcards = new List<Flashcard>();
        var now = DateTime.UtcNow;

        foreach (var candidate in request.Request.Accepted)
        {
            flashcards.Add(new Flashcard
            {
                UserId = request.UserId,
                Question = candidate.Question,
                Answer = candidate.Answer,
                Source = FlashcardSource.AI,
                Status = FlashcardStatus.Accepted,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            });
        }

        // 6. Create flashcard entities from edited candidates
        foreach (var candidate in request.Request.Edited)
        {
            flashcards.Add(new Flashcard
            {
                UserId = request.UserId,
                Question = candidate.Question,
                Answer = candidate.Answer,
                Source = FlashcardSource.AI,
                Status = FlashcardStatus.Edited,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            });
        }

        // 7. Save flashcards to database
        var savedFlashcards = await _flashcardRepository.CreateRangeAsync(
            flashcards,
            cancellationToken);

        // 8. Update generation event with final counts
        generationEvent.AcceptedCount = acceptedCount;
        generationEvent.EditedCount = editedCount;
        generationEvent.UpdatedAtUtc = now;

        await _eventRepository.UpdateAsync(generationEvent, cancellationToken);

        // 9. Commit transaction
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 10. Extract flashcard IDs (after SaveChanges, IDs are generated)
        var flashcardIds = savedFlashcards.Select(f => f.Id).ToList();

        // 11. Calculate rejected count
        var rejectedCount = generationEvent.CandidatesCount - acceptedCount - editedCount;
        var savedCount = acceptedCount + editedCount;

        _logger.LogInformation(
            "Successfully completed flashcard review. EventId: {EventId}, UserId: {UserId}, SavedCount: {SavedCount}, AcceptedCount: {AcceptedCount}, EditedCount: {EditedCount}, RejectedCount: {RejectedCount}",
            request.EventId, request.UserId, savedCount, acceptedCount, editedCount, rejectedCount);

        // 12. Build and return response
        return new CompleteReviewResponseDto
        {
            SavedFlashcardsCount = savedCount,
            AcceptedCount = acceptedCount,
            EditedCount = editedCount,
            RejectedCount = rejectedCount,
            FlashcardIds = flashcardIds
        };
    }
}
