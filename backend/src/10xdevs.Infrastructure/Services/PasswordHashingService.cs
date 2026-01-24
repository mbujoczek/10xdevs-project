using BCrypt.Net;
using _10xdevs.Application.Interfaces;

namespace _10xdevs.Infrastructure.Services;

public class PasswordHashingService : IPasswordHashingService
{
    private const int WorkFactor = 12; // BCrypt cost factor (higher = more secure but slower)

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        return BCrypt.Net.BCrypt.Verify(password, passwordHash);
    }
}
