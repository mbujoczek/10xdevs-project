using MediatR;
using _10xdevs.Application.DTOs.Auth;

namespace _10xdevs.Application.Commands.Users.LoginUser;

public class LoginCommand : IRequest<LoginResponseDto>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
