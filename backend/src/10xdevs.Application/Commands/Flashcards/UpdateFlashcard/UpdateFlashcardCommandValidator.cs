using FluentValidation;

namespace _10xdevs.Application.Commands.Flashcards.UpdateFlashcard;

public class UpdateFlashcardCommandValidator : AbstractValidator<UpdateFlashcardCommand>
{
    public UpdateFlashcardCommandValidator()
    {
        RuleFor(x => x.FlashcardId)
            .GreaterThan(0)
            .WithMessage("FlashcardId must be greater than 0");

        RuleFor(x => x.UserId)
            .GreaterThan(0)
            .WithMessage("UserId must be greater than 0");

        RuleFor(x => x.Question)
            .NotEmpty()
            .WithMessage("Question is required")
            .Must(q => !string.IsNullOrWhiteSpace(q))
            .WithMessage("Question cannot be empty or whitespace")
            .MaximumLength(200)
            .WithMessage("Question must not exceed 200 characters");

        RuleFor(x => x.Answer)
            .NotEmpty()
            .WithMessage("Answer is required")
            .Must(a => !string.IsNullOrWhiteSpace(a))
            .WithMessage("Answer cannot be empty or whitespace")
            .MaximumLength(500)
            .WithMessage("Answer must not exceed 500 characters");
    }
}
