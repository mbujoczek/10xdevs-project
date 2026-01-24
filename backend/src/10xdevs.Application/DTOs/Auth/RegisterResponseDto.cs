namespace _10xdevs.Application.DTOs.Auth;

public class RegisterResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}
