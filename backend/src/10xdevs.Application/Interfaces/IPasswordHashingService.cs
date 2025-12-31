namespace _10xdevs.Application.Interfaces;

public interface IPasswordHashingService
{
    /// <summary>
    /// Hashes a plain-text password using BCrypt algorithm with automatic salt generation.
    /// </summary>
    /// <param name="password">The plain-text password to hash.</param>
    /// <returns>The hashed password string (60-72 characters for BCrypt).</returns>
    string HashPassword(string password);

    /// <summary>
    /// Verifies that a plain-text password matches a previously hashed password.
    /// </summary>
    /// <param name="password">The plain-text password to verify.</param>
    /// <param name="passwordHash">The hashed password to compare against.</param>
    /// <returns>True if the password matches the hash; otherwise, false.</returns>
    bool VerifyPassword(string password, string passwordHash);
}
