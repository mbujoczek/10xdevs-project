using MediatR;
using Microsoft.Extensions.Logging;
using _10xdevs.Application.DTOs.Auth;
using _10xdevs.Application.Exceptions;
using _10xdevs.Application.Interfaces;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;

namespace _10xdevs.Application.Commands.Users.RegisterUser;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, RegisterResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<RegisterUserCommandHandler> _logger;

    public RegisterUserCommandHandler(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IPasswordHashingService passwordHashingService,
        IJwtTokenService jwtTokenService,
        ILogger<RegisterUserCommandHandler> logger)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _passwordHashingService = passwordHashingService;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    public async Task<RegisterResponseDto> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        // Check if username already exists (case-sensitive)
        var usernameExists = await _userRepository.UsernameExistsAsync(request.Username, cancellationToken);
        if (usernameExists)
        {
            _logger.LogWarning(
                "Duplicate username registration attempt. Username: {Username}",
                request.Username);
            throw new DuplicateUsernameException(request.Username);
        }

        // Hash the password
        var passwordHash = _passwordHashingService.HashPassword(request.Password);

        // Create user entity
        var user = new User
        {
            Username = request.Username,
            PasswordHash = passwordHash,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        // Save to database
        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "User registered successfully. UserId: {UserId}, Username: {Username}",
            user.Id,
            user.Username);

        // Generate JWT token
        var token = _jwtTokenService.GenerateToken(user.Id, user.Username);

        // Map to response DTO
        return new RegisterResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Token = token,
            CreatedAtUtc = user.CreatedAtUtc
        };
    }
}
