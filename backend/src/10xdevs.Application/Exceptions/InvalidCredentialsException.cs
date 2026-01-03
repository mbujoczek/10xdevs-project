namespace _10xdevs.Application.Exceptions;

/// <summary>
/// Exception thrown when login credentials are invalid.
/// Message is intentionally generic to prevent user enumeration attacks.
/// </summary>
public class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException()
        : base("The username or password is incorrect.")
    {
    }
}
