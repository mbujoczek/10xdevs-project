using _10xdevs.Api.Extensions;
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
}
