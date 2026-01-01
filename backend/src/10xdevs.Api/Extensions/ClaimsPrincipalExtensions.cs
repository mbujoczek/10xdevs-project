using System.Security.Claims;

namespace _10xdevs.Api.Extensions;

/// <summary>
/// Extension methods for ClaimsPrincipal to extract user information from JWT claims.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Extracts the UserId from JWT claims.
    /// </summary>
    /// <param name="principal">The ClaimsPrincipal from the current user context</param>
    /// <returns>The UserId if found and valid, otherwise 0</returns>
    public static int GetUserId(this ClaimsPrincipal principal)
    {
        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return 0;
        }

        return userId;
    }

    /// <summary>
    /// Extracts the username from JWT claims.
    /// </summary>
    /// <param name="principal">The ClaimsPrincipal from the current user context</param>
    /// <returns>The username if found, null otherwise</returns>
    public static string? GetUsername(this ClaimsPrincipal principal)
    {
        return principal.FindFirst(ClaimTypes.Name)?.Value;
    }
}
