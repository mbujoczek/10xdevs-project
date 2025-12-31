using MediatR;
using Microsoft.AspNetCore.Mvc;
using _10xdevs.Application.Commands.Users.RegisterUser;
using _10xdevs.Application.DTOs.Auth;

namespace _10xdevs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IMediator mediator, ILogger<AuthController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    /// <param name="request">Registration data containing username and password</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User information with authentication token</returns>
    /// <response code="201">User successfully registered</response>
    /// <response code="400">Invalid input data</response>
    /// <response code="409">Username already exists</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var command = new RegisterUserCommand
        {
            Username = request.Username,
            Password = request.Password
        };

        var response = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(Register),
            new { id = response.Id },
            response);
    }
}
