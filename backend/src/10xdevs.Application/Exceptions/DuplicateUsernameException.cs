namespace _10xdevs.Application.Exceptions;

public class DuplicateUsernameException : Exception
{
    public string Username { get; }

    public DuplicateUsernameException(string username)
        : base($"A user with the username '{username}' already exists.")
    {
        Username = username;
    }
}
