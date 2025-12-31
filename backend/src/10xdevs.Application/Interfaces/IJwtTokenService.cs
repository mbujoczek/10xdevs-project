using System.Security.Claims;

namespace _10xdevs.Application.Interfaces;

public interface IJwtTokenService
{
    /// <summary>
    /// Generates a JWT token for the specified user.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="username">The username to include in the token claims.</param>
    /// <returns>A signed JWT token string valid for the configured duration.</returns>
    string GenerateToken(int userId, string username);

    /// <summary>
    /// Validates a JWT token and extracts the claims principal.
    /// </summary>
    /// <param name="token">The JWT token to validate.</param>
    /// <returns>The ClaimsPrincipal if valid; otherwise, null.</returns>
    ClaimsPrincipal? ValidateToken(string token);
}
