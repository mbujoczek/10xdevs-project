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
            .WithErrorMessage("Grade must be between 0 and 5");
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

    #region Invalid FlashcardId

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    [InlineData(int.MinValue)]
    public async Task Validate_ShouldFail_WhenFlashcardIdIsZeroOrNegative(int invalidFlashcardId)
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: invalidFlashcardId,
            UserId: 1,
            Grade: SRSGrade.PerfectResponse);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FlashcardId)
            .WithErrorMessage("FlashcardId must be greater than 0");
    }

    #endregion

    #region Invalid UserId

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    [InlineData(int.MinValue)]
    public async Task Validate_ShouldFail_WhenUserIdIsZeroOrNegative(int invalidUserId)
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 1,
            UserId: invalidUserId,
            Grade: SRSGrade.PerfectResponse);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.UserId)
            .WithErrorMessage("UserId must be greater than 0");
    }

    #endregion

    #region Multiple Validation Errors

    [Fact]
    public async Task Validate_ShouldReturnMultipleErrors_WhenMultipleFieldsAreInvalid()
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 0,
            UserId: -1,
            Grade: (SRSGrade)10);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCount(3);
        result.ShouldHaveValidationErrorFor(x => x.FlashcardId);
        result.ShouldHaveValidationErrorFor(x => x.UserId);
        result.ShouldHaveValidationErrorFor(x => x.Grade);
    }

    [Fact]
    public async Task Validate_ShouldHaveCorrectErrorMessages_ForAllInvalidFields()
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: -1,
            UserId: 0,
            Grade: (SRSGrade)(-5));

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FlashcardId)
            .WithErrorMessage("FlashcardId must be greater than 0");
        result.ShouldHaveValidationErrorFor(x => x.UserId)
            .WithErrorMessage("UserId must be greater than 0");
        result.ShouldHaveValidationErrorFor(x => x.Grade)
            .WithErrorMessage("Grade must be between 0 and 5");
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task Validate_ShouldPass_WhenFlashcardIdIsMaxValue()
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: int.MaxValue,
            UserId: 1,
            Grade: SRSGrade.PerfectResponse);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.FlashcardId);
    }

    [Fact]
    public async Task Validate_ShouldPass_WhenUserIdIsMaxValue()
    {
        // Arrange
        var command = new RateFlashcardCommand(
            FlashcardId: 1,
            UserId: int.MaxValue,
            Grade: SRSGrade.PerfectResponse);

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.UserId);
    }

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

    [Fact]
    public void Validator_ShouldHaveRulesForFlashcardId()
    {
        // Arrange & Act
        var validator = new RateFlashcardCommandValidator();

        // Assert - Verify validator has rules configured
        var result = validator.Validate(new RateFlashcardCommand(0, 1, SRSGrade.PerfectResponse));
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RateFlashcardCommand.FlashcardId));
    }

    [Fact]
    public void Validator_ShouldHaveRulesForUserId()
    {
        // Arrange & Act
        var validator = new RateFlashcardCommandValidator();

        // Assert - Verify validator has rules configured
        var result = validator.Validate(new RateFlashcardCommand(1, 0, SRSGrade.PerfectResponse));
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RateFlashcardCommand.UserId));
    }

    #endregion
}
