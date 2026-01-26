using FluentAssertions;
using FluentValidation.TestHelper;
using _10xdevs.Application.Commands.Learning.RateFlashcard;
using _10xdevs.Domain.Enums;

namespace _10xdevs.Application.Tests.Commands.Learning;

/// <summary>
/// Unit tests for RateFlashcardCommandValidator
/// Tests validation rules for rating flashcards
/// Following xUnit, FluentValidation, and FluentAssertions best practices
/// </summary>
public class RateFlashcardCommandValidatorTests
{
    private readonly RateFlashcardCommandValidator _sut;

    public RateFlashcardCommandValidatorTests()
    {
        _sut = new RateFlashcardCommandValidator();
    }

    #region Valid Commands

    [Theory]
    [InlineData(SRSGrade.CompleteBlackout)]
    [InlineData(SRSGrade.IncorrectResponse)]
    [InlineData(SRSGrade.IncorrectResponseRecalled)]
    [InlineData(SRSGrade.CorrectWithDifficulty)]
    [InlineData(SRSGrade.CorrectAfterHesitation)]
    [InlineData(SRSGrade.PerfectResponse)]
    public async Task Validate_ShouldPass_WhenGradeIsValid(SRSGrade grade)
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 1,
            UserId: 1,
            Grade: grade);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Grade);
    }

    [Fact]
    public async Task Validate_ShouldPass_WhenAllFieldsAreValid()
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 100,
            UserId: 42,
            Grade: SRSGrade.CorrectAfterHesitation);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(1, int.MaxValue)]
    [InlineData(int.MaxValue, 1)]
    [InlineData(999999, 888888)]
    public async Task Validate_ShouldPass_WhenFlashcardIdAndUserIdArePositive(int flashcardId, int userId)
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: flashcardId,
            UserId: userId,
            Grade: SRSGrade.PerfectResponse);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    #endregion

    #region Invalid Grade

    [Theory]
    [InlineData(-1)]
    [InlineData(6)]
    [InlineData(10)]
    [InlineData(100)]
    [InlineData(int.MinValue)]
    [InlineData(int.MaxValue)]
    public async Task Validate_ShouldFail_WhenGradeIsOutOfRange(int invalidGrade)
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 1,
            UserId: 1,
            Grade: (SRSGrade)invalidGrade);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Grade)
            .WithErrorMessage("Grade must be a valid SRSGrade value (0-5)");
    }

    [Fact]
    public async Task Validate_ShouldFail_WhenGradeIsNegative()
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 1,
            UserId: 1,
            Grade: (SRSGrade)(-1));

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Grade);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Validate_ShouldFail_WhenGradeIsGreaterThanFive()
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 1,
            UserId: 1,
            Grade: (SRSGrade)6);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Grade);
        result.IsValid.Should().BeFalse();
    }

    #endregion

    #region Multiple Validation Errors

    [Fact]
    public async Task Validate_ShouldFail_WhenGradeIsInvalid()
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 1,
            UserId: 1,
            Grade: (SRSGrade)10);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCount(1);
        result.ShouldHaveValidationErrorFor(x => x.Grade);
    }

    #endregion

    #region Edge Cases

    [Theory]
    [InlineData(0)] // CompleteBlackout
    [InlineData(5)] // PerfectResponse
    public async Task Validate_ShouldPass_ForBoundaryGradeValues(int gradeValue)
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 1,
            UserId: 1,
            Grade: (SRSGrade)gradeValue);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Grade);
        result.IsValid.Should().BeTrue();
    }

    #endregion

    #region Validator Configuration

    [Fact]
    public void Validator_ShouldHaveRulesForGrade()
    {
        // Arrange & Act
        var validator = new RateFlashcardCommandValidator();

        // Assert - Verify validator has rules configured
        var result = validator.Validate(new RateFlashcardCommand(1, 1, (SRSGrade)10));
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RateFlashcardCommand.Grade));
    }

    #endregion
}
