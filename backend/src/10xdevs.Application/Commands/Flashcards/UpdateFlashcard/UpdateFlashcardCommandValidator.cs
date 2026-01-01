using FluentValidation;

namespace _10xdevs.Application.Commands.Flashcards.UpdateFlashcard;

public class UpdateFlashcardCommandValidator : FlashcardCommandValidatorBase<UpdateFlashcardCommand>
{
    public UpdateFlashcardCommandValidator()
    {
        ValidateFlashcardId(x => x.FlashcardId);
        ValidateUserId(x => x.UserId);

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
