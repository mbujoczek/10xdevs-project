using FluentAssertions;
using _10xdevs.Infrastructure.Services;

namespace _10xdevs.Infrastructure.Tests.Services;

/// <summary>
/// Unit tests for SpacedRepetitionService
/// Tests the SuperMemo2 algorithm implementation with various scenarios
/// Following xUnit and FluentAssertions best practices
/// </summary>
public class SpacedRepetitionServiceTests
{
    private readonly SpacedRepetitionService _sut;

    public SpacedRepetitionServiceTests()
    {
        _sut = new SpacedRepetitionService();
    }

    #region CalculateEaseFactor Tests

    [Theory]
    [InlineData(2.5, 5, 2.5)] // Perfect response at max EF stays at max
    [InlineData(2.5, 4, 2.5)] // Good response at max EF stays at max
    [InlineData(2.5, 3, 2.36)] // Correct with difficulty decreases EF slightly
    [InlineData(2.5, 2, 2.18)] // Incorrect but recalled decreases EF more
    [InlineData(2.5, 1, 1.96)] // Incorrect response significantly decreases EF
    [InlineData(2.5, 0, 1.7)] // Complete blackout heavily decreases EF
    public void CalculateNextReview_ShouldCalculateCorrectEaseFactor_ForDifferentGrades(
        decimal currentEaseFactor, int grade, decimal expectedEaseFactor)
    {
        // Arrange
        var currentRepetitions = 1;
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.EaseFactor.Should().Be(expectedEaseFactor);
    }

    [Fact]
    public void CalculateNextReview_ShouldNotAllowEaseFactorBelowMinimum()
    {
        // Arrange - Start with very low EF and use grade 0 (complete blackout)
        var currentEaseFactor = 1.3m;
        var currentRepetitions = 5;
        var grade = 0;
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.EaseFactor.Should().Be(1.3m, "EF should not go below minimum of 1.3");
    }

    [Fact]
    public void CalculateNextReview_ShouldNotAllowEaseFactorAboveMaximum()
    {
        // Arrange - Start with max EF and use grade 5 (perfect response)
        var currentEaseFactor = 2.5m;
        var currentRepetitions = 1;
        var grade = 5;
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.EaseFactor.Should().BeLessThanOrEqualTo(2.5m, "EF should not exceed maximum of 2.5");
    }

    [Theory]
    [InlineData(1.3, 0)] // Min EF with worst grade
    [InlineData(2.5, 5)] // Max EF with best grade
    [InlineData(1.5, 1)] // Low EF with bad grade
    [InlineData(2.3, 4)] // High EF with good grade
    public void CalculateNextReview_ShouldRoundEaseFactorToTwoDecimalPlaces(decimal currentEF, int grade)
    {
        // Arrange
        var currentRepetitions = 2;
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(currentEF, currentRepetitions, grade, reviewDate);

        // Assert
        var decimalPlaces = BitConverter.GetBytes(decimal.GetBits(result.EaseFactor)[3])[2];
        decimalPlaces.Should().BeLessThanOrEqualTo(2, "EF should be rounded to 2 decimal places");
    }

    #endregion

    #region CalculateInterval Tests

    [Theory]
    [InlineData(0, 2.5, 6)] // currentRep=0 → newRep=1, grade 3 → newEF=2.36: 6 days (fixed)
    [InlineData(1, 2.5, 14)] // currentRep=1 → newRep=2, grade 3, EF 2.5→2.36: (2-1)*6*2.36 = 14.16 → 14
    [InlineData(2, 2.5, 28)] // currentRep=2 → newRep=3, grade 3, EF 2.5→2.36: (3-1)*6*2.36 = 28.32 → 28
    [InlineData(3, 2.5, 42)] // currentRep=3 → newRep=4, grade 3, EF 2.5→2.36: (4-1)*6*2.36 = 42.48 → 42
    [InlineData(4, 2.5, 57)] // currentRep=4 → newRep=5, grade 3, EF 2.5→2.36: (5-1)*6*2.36 = 56.64 → 57
    [InlineData(5, 1.3, 39)] // currentRep=5 → newRep=6, grade 3, EF 1.3→1.3: (6-1)*6*1.3 = 39
    [InlineData(10, 2.0, 112)] // currentRep=10 → newRep=11, grade 3, EF 2.0→1.86: (11-1)*6*1.86 = 111.6 → 112
    public void CalculateNextReview_ShouldCalculateCorrectInterval_ForSuccessfulGrades(
        int currentRepetitions, decimal easeFactor, int expectedInterval)
    {
        // Arrange
        var grade = 3; // Passing grade
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(easeFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.Interval.Should().Be(expectedInterval);
    }

    [Theory]
    [InlineData(0, 2.5, 0)] // Grade 0: Complete blackout
    [InlineData(1, 2.5, 1)] // Grade 1: Incorrect response
    [InlineData(2, 2.5, 2)] // Grade 2: Incorrect but recalled
    public void CalculateNextReview_ShouldResetToOneDayInterval_WhenGradeBelowThree(
        int grade, decimal easeFactor, int currentRepetitions)
    {
        // Arrange
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(easeFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.Interval.Should().Be(1, "failing grades should reset interval to 1 day");
    }

    #endregion

    #region CalculateRepetitions Tests

    [Theory]
    [InlineData(0, 3, 1)] // First successful review
    [InlineData(1, 4, 2)] // Second successful review
    [InlineData(5, 5, 6)] // Many successful reviews
    [InlineData(10, 3, 11)] // Continuing streak
    public void CalculateNextReview_ShouldIncrementRepetitions_WhenGradeThreeOrAbove(
        int currentRepetitions, int grade, int expectedRepetitions)
    {
        // Arrange
        var easeFactor = 2.5m;
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(easeFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.Repetitions.Should().Be(expectedRepetitions);
    }

    [Theory]
    [InlineData(0, 0)] // Grade 0: Complete blackout
    [InlineData(1, 1)] // Grade 1: Incorrect response
    [InlineData(2, 2)] // Grade 2: Incorrect but recalled
    [InlineData(5, 0)] // Grade 0 after many repetitions
    [InlineData(5, 1)] // Grade 1 after many repetitions
    [InlineData(10, 2)] // Grade 2 after many repetitions
    public void CalculateNextReview_ShouldResetRepetitionsToZero_WhenGradeBelowThree(
        int currentRepetitions, int grade)
    {
        // Arrange
        var easeFactor = 2.5m;
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(easeFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.Repetitions.Should().Be(0, "failing grades should reset repetition count");
    }

    #endregion

    #region CalculateNextRepetitionDate Tests

    [Fact]
    public void CalculateNextReview_ShouldCalculateCorrectNextRepetitionDate_ForOneDay()
    {
        // Arrange
        var currentEaseFactor = 2.5m;
        var currentRepetitions = 0;
        var grade = 3;
        var reviewDate = new DateTime(2026, 1, 25, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert - newRep=1 -> 6 days
        var expectedDate = reviewDate.AddDays(6);
        result.NextRepetitionDate.Should().Be(expectedDate);
    }

    [Fact]
    public void CalculateNextReview_ShouldCalculateCorrectNextRepetitionDate_ForSixDays()
    {
        // Arrange
        var currentEaseFactor = 2.5m;
        var currentRepetitions = 1;
        var grade = 4;
        var reviewDate = new DateTime(2026, 1, 25, 15, 30, 0, DateTimeKind.Utc);

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert - newRep=2, grade 4: EF stays 2.5, interval=(2-1)*6*2.5=15 days
        var expectedDate = reviewDate.AddDays(15);
        result.NextRepetitionDate.Should().Be(expectedDate);
    }

    [Fact]
    public void CalculateNextReview_ShouldCalculateCorrectNextRepetitionDate_ForLongInterval()
    {
        // Arrange
        var currentEaseFactor = 2.0m;
        var currentRepetitions = 10;
        var grade = 5;
        var reviewDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert - newRep=11, grade 5: EF 2.0→2.1, interval=(11-1)*6*2.1=126 days
        var expectedDate = reviewDate.AddDays(126);
        result.NextRepetitionDate.Should().Be(expectedDate);
    }

    [Fact]
    public void CalculateNextReview_ShouldPreserveTimeComponent_InNextRepetitionDate()
    {
        // Arrange
        var currentEaseFactor = 2.5m;
        var currentRepetitions = 2;
        var grade = 4;
        var reviewDate = new DateTime(2026, 1, 25, 14, 45, 30, 123, DateTimeKind.Utc);

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.NextRepetitionDate.TimeOfDay.Should().Be(reviewDate.TimeOfDay);
    }

    #endregion

    #region Edge Cases and Business Rules

    [Fact]
    public void CalculateNextReview_ShouldHandleNewCard_WithDefaultParameters()
    {
        // Arrange - Brand new flashcard
        var currentEaseFactor = 2.5m;
        var currentRepetitions = 0;
        var grade = 4; // Good response
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.Interval.Should().Be(6, "first successful review: newRep=1 -> 6 days");
        result.Repetitions.Should().Be(1, "first successful review");
        result.EaseFactor.Should().Be(2.5m, "good response maintains default EF");
    }

    [Fact]
    public void CalculateNextReview_ShouldHandlePerfectStreak_OverMultipleReviews()
    {
        // Arrange - Simulate multiple perfect reviews
        var easeFactor = 2.5m;
        var repetitions = 0;
        var grade = 5; // Perfect response
        var reviewDate = DateTime.UtcNow;

        // Act & Assert - First review
        var result1 = _sut.CalculateNextReview(easeFactor, repetitions, grade, reviewDate);
        result1.Interval.Should().Be(6); // newRep=1 -> 6 days
        result1.Repetitions.Should().Be(1);
        result1.EaseFactor.Should().BeGreaterThanOrEqualTo(2.5m);

        // Second review
        var result2 = _sut.CalculateNextReview(result1.EaseFactor, result1.Repetitions, grade, reviewDate);
        result2.Interval.Should().Be(15); // newRep=2, EF=2.5: (2-1)*6*2.5=15
        result2.Repetitions.Should().Be(2);

        // Third review
        var result3 = _sut.CalculateNextReview(result2.EaseFactor, result2.Repetitions, grade, reviewDate);
        result3.Interval.Should().BeGreaterThan(6);
        result3.Repetitions.Should().Be(3);
    }

    [Fact]
    public void CalculateNextReview_ShouldResetProgress_AfterFailingGrade()
    {
        // Arrange - Card with some progress
        var currentEaseFactor = 2.0m;
        var currentRepetitions = 5; // Already reviewed 5 times
        var grade = 1; // Fail
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result.Interval.Should().Be(1, "failed review resets to 1 day");
        result.Repetitions.Should().Be(0, "failed review resets repetition count");
        result.EaseFactor.Should().BeLessThan(currentEaseFactor, "failed review decreases EF");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void CalculateNextReview_ShouldHandleAllValidGrades(int grade)
    {
        // Arrange
        var currentEaseFactor = 2.0m;
        var currentRepetitions = 1;
        var reviewDate = DateTime.UtcNow;

        // Act
        var act = () => _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert
        act.Should().NotThrow("all grades 0-5 should be valid");
        var result = act();
        result.Should().NotBeNull();
        result.Interval.Should().BeGreaterThan(0);
        result.EaseFactor.Should().BeInRange(1.3m, 2.5m);
    }

    [Fact]
    public void CalculateNextReview_ShouldHandleDifficultCard_WithLowEaseFactor()
    {
        // Arrange - Card that has been consistently difficult
        var currentEaseFactor = 1.3m; // Minimum EF
        var currentRepetitions = 3;
        var grade = 3; // Barely passing
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert - newRep=4, EF 1.3->1.3 (at min): (4-1)*6*1.3 = 23.4 -> 23
        result.Interval.Should().BeLessThan(25, "difficult cards should have shorter intervals");
        result.EaseFactor.Should().BeGreaterThanOrEqualTo(1.3m, "EF should stay at or above minimum");
    }

    [Fact]
    public void CalculateNextReview_ShouldHandleEasyCard_WithHighEaseFactor()
    {
        // Arrange - Card that has been consistently easy
        var currentEaseFactor = 2.5m; // Maximum EF
        var currentRepetitions = 5;
        var grade = 5; // Perfect response
        var reviewDate = DateTime.UtcNow;

        // Act
        var result = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert - newRep=6, EF stays 2.5: (6-1)*6*2.5 = 75
        result.Interval.Should().BeGreaterThan(70, "easy cards should have longer intervals");
        result.EaseFactor.Should().BeLessThanOrEqualTo(2.5m, "EF should not exceed maximum");
    }

    [Fact]
    public void CalculateNextReview_ShouldMaintainConsistency_AcrossSameInputs()
    {
        // Arrange
        var currentEaseFactor = 2.0m;
        var currentRepetitions = 3;
        var grade = 4;
        var reviewDate = new DateTime(2026, 1, 25, 12, 0, 0, DateTimeKind.Utc);

        // Act
        var result1 = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);
        var result2 = _sut.CalculateNextReview(currentEaseFactor, currentRepetitions, grade, reviewDate);

        // Assert
        result1.Should().BeEquivalentTo(result2, "same inputs should produce same outputs");
    }

    #endregion
}
