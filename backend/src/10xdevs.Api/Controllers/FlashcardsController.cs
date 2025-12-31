using _10xdevs.Api.Extensions;
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
}
