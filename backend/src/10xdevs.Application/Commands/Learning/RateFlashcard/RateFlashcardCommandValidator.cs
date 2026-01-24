using _10xdevs.Domain.Enums;
using FluentValidation;

namespace _10xdevs.Application.Commands.Learning.RateFlashcard;

public sealed class RateFlashcardCommandValidator : AbstractValidator<RateFlashcardCommand>
{
    public RateFlashcardCommandValidator()
    {
        RuleFor(x => x.Grade)
            .IsInEnum()
            .WithMessage("Grade must be a valid SRSGrade value (0-5)");
    }
}
