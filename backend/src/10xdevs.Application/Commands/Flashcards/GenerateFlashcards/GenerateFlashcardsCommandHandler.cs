using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Interfaces;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Application.Commands.Flashcards.GenerateFlashcards;

/// <summary>
/// Handler for GenerateFlashcardsCommand.
/// Orchestrates the flashcard generation process using AI service and persists the generation event.
/// </summary>
public class GenerateFlashcardsCommandHandler : IRequestHandler<GenerateFlashcardsCommand, GenerateFlashcardsResponseDto>
{
    private readonly IFlashcardAIService _aiService;
    private readonly IFlashcardGenerationEventRepository _eventRepository;
    private readonly ILogger<GenerateFlashcardsCommandHandler> _logger;

    public GenerateFlashcardsCommandHandler(
        IFlashcardAIService aiService,
        IFlashcardGenerationEventRepository eventRepository,
        ILogger<GenerateFlashcardsCommandHandler> logger)
    {
        _aiService = aiService ?? throw new ArgumentNullException(nameof(aiService));
        _eventRepository = eventRepository ?? throw new ArgumentNullException(nameof(eventRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<GenerateFlashcardsResponseDto> Handle(
        GenerateFlashcardsCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Starting flashcard generation for UserId: {UserId}, Language: {Language}, InputLength: {InputLength}",
            request.UserId, request.Language, request.InputText.Length);

        try
        {
            // Step 1: Call AI service to generate flashcard candidates
            var candidates = await _aiService.GenerateFlashcardsAsync(
                request.InputText,
                request.Language,
                cancellationToken);

            _logger.LogInformation(
                "AI service returned {Count} candidates for UserId: {UserId}",
                candidates.Count, request.UserId);

            // Step 2: Generate temporary candidate IDs
            for (int i = 0; i < candidates.Count; i++)
            {
                candidates[i].CandidateId = $"temp-{i + 1}";
            }

            // Step 3: Create FlashcardGenerationEvent entity
            var generationEvent = new FlashcardGenerationEvent
            {
                UserId = request.UserId,
                CandidatesCount = candidates.Count,
                AcceptedCount = 0,
                EditedCount = 0,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };

            // Step 4: Persist generation event to database
            var savedEvent = await _eventRepository.CreateAsync(generationEvent, cancellationToken);

            _logger.LogInformation(
                "Created FlashcardGenerationEvent with Id: {EventId} for UserId: {UserId}",
                savedEvent.Id, request.UserId);

            // Step 5: Map to response DTO
            var response = new GenerateFlashcardsResponseDto
            {
                GenerationEventId = savedEvent.Id,
                Candidates = candidates,
                CandidatesCount = candidates.Count,
                CreatedAtUtc = savedEvent.CreatedAtUtc
            };

            _logger.LogInformation(
                "Successfully completed flashcard generation for UserId: {UserId}, EventId: {EventId}",
                request.UserId, savedEvent.Id);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to generate flashcards for UserId: {UserId}",
                request.UserId);
            throw;
        }
    }
}
