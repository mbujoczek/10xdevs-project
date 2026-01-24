using _10xdevs.Api.Extensions;
using _10xdevs.Application.Commands.Flashcards.CompleteReview;
using _10xdevs.Application.Commands.Flashcards.CreateManualFlashcard;
using _10xdevs.Application.Commands.Flashcards.DeleteFlashcard;
using _10xdevs.Application.Commands.Flashcards.GenerateFlashcards;
using _10xdevs.Application.Commands.Flashcards.UpdateFlashcard;
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Queries.Flashcards.GetFlashcardById;
using _10xdevs.Application.Queries.Flashcards.GetUserFlashcards;
using _10xdevs.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _10xdevs.Api.Controllers;

[ApiController]
[Route("api/flashcards")]
[Authorize]
public class FlashcardsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<FlashcardsController> _logger;

    public FlashcardsController(IMediator mediator, ILogger<FlashcardsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all active flashcards for the authenticated user with optional filtering
    /// </summary>
    /// <param name="status">Filter by status (0=Not Applicable, 1=Accepted, 2=Edited). Can specify multiple.</param>
    /// <param name="source">Filter by source (0=AI, 1=Manual)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of flashcards matching the criteria</returns>
    /// <response code="200">Flashcards retrieved successfully</response>
    /// <response code="400">Invalid query parameter values</response>
    /// <response code="401">Unauthorized - invalid or missing token</response>
    [HttpGet]
    [ProducesResponseType(typeof(ListFlashcardsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ListFlashcardsResponseDto>> GetFlashcards(
        [FromQuery] List<int>? status,
        [FromQuery] int? source,
        CancellationToken cancellationToken)
    {
        List<FlashcardStatus>? statusFilter = null;
        if (status != null && status.Any())
        {
            if (status.Any(s => !Enum.IsDefined(typeof(FlashcardStatus), s) || s == (int)FlashcardStatus.Deleted))
            {
                return BadRequest("Status must be 0 (Not Applicable), 1 (Accepted), or 2 (Edited)");
            }
            statusFilter = status.Select(s => (FlashcardStatus)s).ToList();
        }

        FlashcardSource? sourceFilter = null;
        if (source.HasValue)
        {
            if (!Enum.IsDefined(typeof(FlashcardSource), source.Value))
            {
                return BadRequest("Source must be 0 (AI) or 1 (Manual)");
            }
            sourceFilter = (FlashcardSource)source.Value;
        }

        var query = new GetUserFlashcardsQuery
        {
            UserId = User.GetUserId(),
            StatusFilter = statusFilter,
            SourceFilter = sourceFilter
        };

        var response = await _mediator.Send(query, cancellationToken);

        return Ok(response);
    }

    /// <summary>
    /// Retrieves a single flashcard by ID
    /// </summary>
    /// <param name="id">Unique flashcard identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Flashcard details with full metadata</returns>
    /// <response code="200">Returns the flashcard details</response>
    /// <response code="401">Unauthorized - invalid or missing token</response>
    /// <response code="404">Not found - flashcard doesn't exist or is deleted</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(FlashcardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FlashcardDto>> GetFlashcard(
        int id,
        CancellationToken cancellationToken)
    {
        var query = new GetFlashcardByIdQuery
        {
            FlashcardId = id,
            UserId = User.GetUserId()
        };

        var flashcard = await _mediator.Send(query, cancellationToken);

        return Ok(flashcard);
    }

    /// <summary>
    /// Creates a new flashcard manually
    /// </summary>
    /// <param name="request">Flashcard question and answer</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created flashcard with assigned ID</returns>
    /// <response code="201">Returns the newly created flashcard</response>
    /// <response code="400">Validation failed - empty fields or exceeding length limits</response>
    /// <response code="401">Unauthorized - invalid or missing token</response>
    [HttpPost]
    [ProducesResponseType(typeof(FlashcardDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<FlashcardDto>> CreateFlashcard(
        [FromBody] CreateFlashcardRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var command = new CreateManualFlashcardCommand(
            userId,
            request.Question,
            request.Answer);

        var flashcard = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetFlashcard),
            new { id = flashcard.Id },
            flashcard);
    }

    /// <summary>
    /// Updates an existing flashcard's question and/or answer
    /// </summary>
    /// <param name="id">Flashcard identifier</param>
    /// <param name="request">Updated question and answer</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated flashcard with modified timestamp</returns>
    /// <response code="200">Returns the updated flashcard</response>
    /// <response code="400">Validation failed - empty fields or exceeding length limits</response>
    /// <response code="401">Unauthorized - invalid or missing token</response>
    /// <response code="404">Not found - flashcard doesn't exist, is deleted, or belongs to another user</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(FlashcardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FlashcardDto>> UpdateFlashcard(
        int id,
        [FromBody] UpdateFlashcardRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var command = new UpdateFlashcardCommand(
            id,
            userId,
            request.Question,
            request.Answer);

        var flashcard = await _mediator.Send(command, cancellationToken);

        return Ok(flashcard);
    }

    /// <summary>
    /// Deletes a flashcard by its ID (soft delete).
    /// </summary>
    /// <param name="id">The ID of the flashcard to delete.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>No content on successful deletion.</returns>
    /// <response code="204">Flashcard successfully deleted</response>
    /// <response code="400">Invalid flashcard ID</response>
    /// <response code="401">Unauthorized - invalid or missing token</response>
    /// <response code="404">Not found - flashcard doesn't exist, is already deleted, or belongs to another user</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFlashcard(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        _logger.LogInformation(
            "Deleting flashcard. UserId: {UserId}, FlashcardId: {FlashcardId}",
            userId, id);

        var command = new DeleteFlashcardCommand(id, userId);
        await _mediator.Send(command, cancellationToken);

        _logger.LogInformation(
            "Successfully deleted flashcard. UserId: {UserId}, FlashcardId: {FlashcardId}",
            userId, id);

        return NoContent();
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
        var userId = User.GetUserId();

        _logger.LogInformation(
            "Received flashcard generation request from UserId: {UserId}, Language: {Language}",
            userId, request.Language);

        var command = new GenerateFlashcardsCommand
        {
            UserId = userId,
            InputText = request.InputText,
            Language = request.Language ?? "en"
        };

        var response = await _mediator.Send(command, cancellationToken);

        _logger.LogInformation(
            "Successfully generated flashcards for UserId: {UserId}, EventId: {EventId}",
            userId, response.GenerationEventId);

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
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid model state for CompleteReview request");
            return BadRequest(ModelState);
        }

        var userId = User.GetUserId();

        _logger.LogInformation(
            "Received complete review request from UserId: {UserId}, EventId: {EventId}",
            userId, eventId);

        var command = new CompleteReviewCommand(eventId, userId, request);
        var response = await _mediator.Send(command, cancellationToken);

        _logger.LogInformation(
            "Successfully completed review for UserId: {UserId}, EventId: {EventId}, SavedCount: {SavedCount}",
            userId, eventId, response.SavedFlashcardsCount);

        return Ok(response);
    }
}
