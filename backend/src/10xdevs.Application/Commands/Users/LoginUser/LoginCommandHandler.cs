using MediatR;
using Microsoft.Extensions.Logging;
using _10xdevs.Application.DTOs.Auth;
using _10xdevs.Application.Exceptions;
using _10xdevs.Application.Interfaces;
using _10xdevs.Domain.Interfaces;

namespace _10xdevs.Application.Commands.Users.LoginUser;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHashingService passwordHashingService,
        IJwtTokenService jwtTokenService,
        ILogger<LoginCommandHandler> logger)
    {
        _userRepository = userRepository;
        _passwordHashingService = passwordHashingService;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    public async Task<LoginResponseDto> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        // Retrieve user by username (case-sensitive)
        var user = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning(
                "Login attempt failed: User not found. Username: {Username}",
                request.Username.Substring(0, Math.Min(3, request.Username.Length)) + "***");
            throw new InvalidCredentialsException();
        }

        // Verify password
        var isPasswordValid = _passwordHashingService.VerifyPassword(
            request.Password,
            user.PasswordHash);

        if (!isPasswordValid)
        {
            _logger.LogWarning(
                "Login attempt failed: Invalid password. UserId: {UserId}",
                user.Id);
            throw new InvalidCredentialsException();
        }

        _logger.LogInformation(
            "User logged in successfully. UserId: {UserId}, Username: {Username}",
            user.Id,
            user.Username);

        // Generate JWT token
        var token = _jwtTokenService.GenerateToken(user.Id, user.Username);

        // Extract expiration date from the generated token to ensure consistency
        var expiresAt = _jwtTokenService.GetTokenExpiration(token)
            ?? throw new InvalidOperationException("Failed to extract token expiration.");

        // Map to response DTO
        return new LoginResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Token = token,
            ExpiresAt = expiresAt
        };
    }
}
