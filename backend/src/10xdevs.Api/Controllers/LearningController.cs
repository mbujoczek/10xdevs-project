using _10xdevs.Api.Extensions;
using _10xdevs.Application.Commands.Learning.RateFlashcard;
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Application.Queries.Learning.GetDueFlashcards;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _10xdevs.Api.Controllers;

[ApiController]
[Route("api/learning")]
[Authorize]
public class LearningController : ControllerBase
{
    private readonly IMediator _mediator;

    public LearningController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Retrieves all flashcards due for review based on SRS algorithm
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of due flashcards with total count</returns>
    /// <response code="200">Flashcards retrieved successfully</response>
    /// <response code="401">Unauthorized - invalid or missing token</response>
    [HttpGet("due")]
    [ProducesResponseType(typeof(DueFlashcardsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<DueFlashcardsResponseDto>> GetDueFlashcards(
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var query = new GetDueFlashcardsQuery(userId);
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Rate a flashcard and update SRS parameters
    /// </summary>
    /// <param name="id">Flashcard ID</param>
    /// <param name="request">Rating data containing grade (0-5)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated flashcard with new SRS parameters</returns>
    /// <response code="200">Flashcard rated successfully</response>
    /// <response code="400">Invalid grade value</response>
    /// <response code="401">Unauthorized - invalid or missing token</response>
    /// <response code="404">Flashcard not found</response>
    [HttpPost("flashcards/{id}/rate")]
    [ProducesResponseType(typeof(RateFlashcardResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RateFlashcard(
        [FromRoute] int id,
        [FromBody] RateFlashcardRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var command = new RateFlashcardCommand(
            FlashcardId: id,
            UserId: userId,
            Grade: request.Grade);

        var result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }
}
