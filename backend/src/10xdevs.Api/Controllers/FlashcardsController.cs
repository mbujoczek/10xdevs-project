using _10xdevs.Api.Extensions;
using _10xdevs.Application.Commands.Flashcards.CompleteReview;
using _10xdevs.Application.Commands.Flashcards.GenerateFlashcards;
using _10xdevs.Application.DTOs.Flashcards;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _10xdevs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FlashcardsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<FlashcardsController> _logger;

    public FlashcardsController(IMediator mediator, ILogger<FlashcardsController> logger)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Generates flashcard candidates from input text using AI (Ollama/Phi3).
    /// </summary>
    /// <param name="request">The input text and optional language parameter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A list of flashcard candidates and generation event ID</returns>
    /// <response code="201">Flashcards generated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">Unauthorized - invalid or missing token</response>
    /// <response code="503">AI service unavailable</response>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(GenerateFlashcardsResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<GenerateFlashcardsResponseDto>> GenerateFlashcards(
        [FromBody] GenerateFlashcardsRequestDto request,
        CancellationToken cancellationToken)
    {
        // Extract UserId from JWT claims
        var userId = User.GetUserId();
        if (!userId.HasValue)
        {
            _logger.LogWarning("Failed to extract UserId from JWT token");
            return Unauthorized();
        }

        _logger.LogInformation(
            "Received flashcard generation request from UserId: {UserId}, Language: {Language}",
            userId.Value, request.Language);

        // Create command
        var command = new GenerateFlashcardsCommand
        {
            UserId = userId.Value,
            InputText = request.InputText,
            Language = request.Language ?? "en"
        };

        // Send command to MediatR
        var response = await _mediator.Send(command, cancellationToken);

        _logger.LogInformation(
            "Successfully generated flashcards for UserId: {UserId}, EventId: {EventId}",
            userId.Value, response.GenerationEventId);

        // Return 201 Created
        return Created($"/api/flashcards/generation/{response.GenerationEventId}", response);
    }

    /// <summary>
    /// Completes the flashcard review process by saving accepted and edited flashcards
    /// </summary>
    /// <param name="eventId">Generation event identifier</param>
    /// <param name="request">Accepted and edited flashcards</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistics about saved flashcards</returns>
    /// <response code="200">Review completed successfully</response>
    /// <response code="400">Validation failed or no flashcards submitted</response>
    /// <response code="401">Missing or invalid authentication token</response>
    /// <response code="403">Event belongs to different user</response>
    /// <response code="404">Generation event not found</response>
    /// <response code="409">Review already completed</response>
    [HttpPost("generation/{eventId}/complete")]
    [ProducesResponseType(typeof(CompleteReviewResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CompleteReviewResponseDto>> CompleteReview(
        int eventId,
        [FromBody] CompleteReviewRequestDto request,
        CancellationToken cancellationToken)
    {
        // Validate model state
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid model state for CompleteReview request");
            return BadRequest(ModelState);
        }

        // Extract UserId from JWT claims
        var userId = User.GetUserId();
        if (!userId.HasValue)
        {
            _logger.LogWarning("Failed to extract UserId from JWT token");
            return Unauthorized();
        }

        _logger.LogInformation(
            "Received complete review request from UserId: {UserId}, EventId: {EventId}",
            userId.Value, eventId);

        // Create and send command
        var command = new CompleteReviewCommand(eventId, userId.Value, request);
        var response = await _mediator.Send(command, cancellationToken);

        _logger.LogInformation(
            "Successfully completed review for UserId: {UserId}, EventId: {EventId}, SavedCount: {SavedCount}",
            userId.Value, eventId, response.SavedFlashcardsCount);

        return Ok(response);
    }
}
