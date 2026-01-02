using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using _10xdevs.Application.DTOs.Statistics;
using _10xdevs.Application.Queries.Statistics.GetGenerationAcceptance;

namespace _10xdevs.Api.Controllers;

[ApiController]
[Route("api/statistics")]
[Authorize]
public class StatisticsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<StatisticsController> _logger;

    public StatisticsController(IMediator mediator, ILogger<StatisticsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves global AI acceptance metrics from all system users for success tracking
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Global generation acceptance statistics with calculated rates and success metric</returns>
    /// <response code="200">Successfully retrieved acceptance statistics</response>
    /// <response code="401">Missing or invalid authentication token</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("generation-acceptance")]
    [ProducesResponseType(typeof(GenerationAcceptanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetGenerationAcceptance(CancellationToken cancellationToken)
    {
        var query = new GetGenerationAcceptanceQuery();
        var response = await _mediator.Send(query, cancellationToken);
        return Ok(response);
    }
}
