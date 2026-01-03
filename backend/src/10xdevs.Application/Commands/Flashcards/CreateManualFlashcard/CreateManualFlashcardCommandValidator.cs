using FluentValidation;

namespace _10xdevs.Application.Commands.Flashcards.CreateManualFlashcard;

public class CreateManualFlashcardCommandValidator : AbstractValidator<CreateManualFlashcardCommand>
{
    public CreateManualFlashcardCommandValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0)
            .WithMessage("UserId must be greater than 0");

        RuleFor(x => x.Question)
            .NotEmpty()
            .WithMessage("Question cannot be empty")
            .Must(q => !string.IsNullOrWhiteSpace(q))
            .WithMessage("Question cannot be empty or whitespace")
            .MaximumLength(200)
            .WithMessage("Question must not exceed 200 characters");

        RuleFor(x => x.Answer)
            .NotEmpty()
            .WithMessage("Answer cannot be empty")
            .Must(a => !string.IsNullOrWhiteSpace(a))
            .WithMessage("Answer cannot be empty or whitespace")
            .MaximumLength(500)
            .WithMessage("Answer must not exceed 500 characters");
    }
}
