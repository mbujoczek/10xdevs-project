namespace _10xdevs.Application.Commands.Flashcards.DeleteFlashcard;

public class DeleteFlashcardCommandValidator : FlashcardCommandValidatorBase<DeleteFlashcardCommand>
{
    public DeleteFlashcardCommandValidator()
    {
        ValidateFlashcardId(x => x.FlashcardId);
        ValidateUserId(x => x.UserId);
    }
}
