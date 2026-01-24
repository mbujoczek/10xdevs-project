using FluentValidation;
using System.Linq.Expressions;

namespace _10xdevs.Application.Commands.Flashcards;

public abstract class FlashcardCommandValidatorBase<T> : AbstractValidator<T> where T : class
{
    protected void ValidateFlashcardId(Expression<Func<T, int>> expression)
    {
        RuleFor(expression)
            .GreaterThan(0)
            .WithMessage("FlashcardId must be greater than 0");
    }

    protected void ValidateUserId(Expression<Func<T, int>> expression)
    {
        RuleFor(expression)
            .GreaterThan(0)
            .WithMessage("UserId must be greater than 0");
    }
}
