using AutoMapper;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using _10xdevs.Application.Commands.Learning.RateFlashcard;
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Application.Exceptions;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Interfaces;
using _10xdevs.Domain.ValueObjects;

namespace _10xdevs.Application.Tests.Commands.Learning;

/// <summary>
/// Unit tests for RateFlashcardCommandHandler
/// Tests flashcard rating and SRS parameter update logic
/// Following xUnit, NSubstitute, and FluentAssertions best practices
/// </summary>
public class RateFlashcardCommandHandlerTests
{
    private readonly IFlashcardRepository _mockFlashcardRepository;
    private readonly ISpacedRepetitionService _mockSpacedRepetitionService;
    private readonly IUnitOfWork _mockUnitOfWork;
    private readonly IMapper _mockMapper;
    private readonly RateFlashcardCommandHandler _sut;

    public RateFlashcardCommandHandlerTests()
    {
        _mockFlashcardRepository = Substitute.For<IFlashcardRepository>();
        _mockSpacedRepetitionService = Substitute.For<ISpacedRepetitionService>();
        _mockUnitOfWork = Substitute.For<IUnitOfWork>();
        _mockMapper = Substitute.For<IMapper>();

        _sut = new RateFlashcardCommandHandler(
            _mockFlashcardRepository,
            _mockSpacedRepetitionService,
            _mockUnitOfWork,
            _mockMapper);
    }

    #region Successful Scenarios

    [Fact]
    public async Task Handle_ShouldRateFlashcard_WithGrade0()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.CompleteBlackout;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var srsResult = CreateSRSResult(1, 0, 1.7m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        flashcard.SRSLastGrade.Should().Be(grade);
        await _mockUnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldRateFlashcard_WithGrade5()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var srsResult = CreateSRSResult(15, 3, 2.5m, DateTime.UtcNow.AddDays(15));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        flashcard.SRSLastGrade.Should().Be(grade);
        await _mockUnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(SRSGrade.CompleteBlackout)]
    [InlineData(SRSGrade.IncorrectResponse)]
    [InlineData(SRSGrade.IncorrectResponseRecalled)]
    [InlineData(SRSGrade.CorrectWithDifficulty)]
    [InlineData(SRSGrade.CorrectAfterHesitation)]
    [InlineData(SRSGrade.PerfectResponse)]
    public async Task Handle_ShouldAcceptAllValidGrades(SRSGrade grade)
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var srsResult = CreateSRSResult(1, 1, 2.5m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        var act = async () => await _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Handle_ShouldCallSpacedRepetitionService_WithCorrectParameters()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.CorrectAfterHesitation;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId, easeFactor: 2.0m, repetitions: 3);
        var srsResult = CreateSRSResult(30, 4, 2.0m, DateTime.UtcNow.AddDays(30));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _mockSpacedRepetitionService.Received(1).CalculateNextReview(
            Arg.Is<decimal>(ef => ef == 2.0m),
            Arg.Is<int>(rep => rep == 3),
            Arg.Is<int>(g => g == (int)grade),
            Arg.Any<DateTime>());
    }

    [Fact]
    public async Task Handle_ShouldUpdateFlashcardWithSRSParameters()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.CorrectWithDifficulty;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var expectedDate = DateTime.UtcNow.AddDays(6);
        var srsResult = CreateSRSResult(6, 2, 2.36m, expectedDate);
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        flashcard.SRSInterval.Should().Be(6);
        flashcard.SRSRepetitions.Should().Be(2);
        flashcard.SRSEaseFactor.Should().Be(2.36m);
        flashcard.SRSNextRepetitionDate.Should().BeCloseTo(expectedDate, TimeSpan.FromSeconds(1));
        flashcard.SRSLastGrade.Should().Be(grade);
    }

    [Fact]
    public async Task Handle_ShouldSaveChangesToDatabase()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.CorrectAfterHesitation;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var srsResult = CreateSRSResult(1, 1, 2.5m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        await _mockUnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldMapFlashcardToResponseDto()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var srsResult = CreateSRSResult(1, 1, 2.5m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _mockMapper.Received(1).Map<RateFlashcardResponseDto>(Arg.Is<Flashcard>(f => f.Id == flashcardId));
    }

    #endregion

    #region Exception Scenarios

    [Fact]
    public async Task Handle_ShouldThrowNotFoundException_WhenFlashcardNotFound()
    {
        // Arrange
        var flashcardId = 999;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        _mockFlashcardRepository.GetByIdAsync(flashcardId, userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<Flashcard?>(null));

        // Act
        var act = async () => await _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"Flashcard with ID {flashcardId} not found");
    }

    [Fact]
    public async Task Handle_ShouldThrowNotFoundException_WhenFlashcardBelongsToDifferentUser()
    {
        // Arrange
        var flashcardId = 1;
        var requestingUserId = 1;
        var ownerUserId = 2;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, requestingUserId, grade);

        _mockFlashcardRepository.GetByIdAsync(flashcardId, requestingUserId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<Flashcard?>(null)); // Repository filters by userId

        // Act
        var act = async () => await _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ShouldPropagateException_WhenRepositoryThrows()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        _mockFlashcardRepository.GetByIdAsync(flashcardId, userId, Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("Database error"));

        // Act
        var act = async () => await _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Database error");
    }

    [Fact]
    public async Task Handle_ShouldPropagateException_WhenSaveChangesFails()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var srsResult = CreateSRSResult(1, 1, 2.5m, DateTime.UtcNow.AddDays(1));

        _mockFlashcardRepository.GetByIdAsync(flashcardId, userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<Flashcard?>(flashcard));
        _mockSpacedRepetitionService.CalculateNextReview(
            Arg.Any<decimal>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<DateTime>())
            .Returns(srsResult);
        _mockUnitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("Save failed"));

        // Act
        var act = async () => await _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Save failed");
    }

    #endregion

    #region Business Rules Tests

    [Fact]
    public async Task Handle_ShouldUseDefaultEaseFactor_WhenFlashcardHasNullEaseFactor()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId, easeFactor: null);
        var srsResult = CreateSRSResult(1, 1, 2.5m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _mockSpacedRepetitionService.Received(1).CalculateNextReview(
            Arg.Is<decimal>(ef => ef == 2.5m), // Default EF
            Arg.Any<int>(),
            Arg.Any<int>(),
            Arg.Any<DateTime>());
    }

    [Fact]
    public async Task Handle_ShouldUseZeroRepetitions_WhenFlashcardHasNullRepetitions()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId, repetitions: null);
        var srsResult = CreateSRSResult(1, 1, 2.5m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _mockSpacedRepetitionService.Received(1).CalculateNextReview(
            Arg.Any<decimal>(),
            Arg.Is<int>(rep => rep == 0), // Default repetitions
            Arg.Any<int>(),
            Arg.Any<DateTime>());
    }

    [Fact]
    public async Task Handle_ShouldResetProgressForNewCard_WithFailingGrade()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.IncorrectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId, easeFactor: null, repetitions: null);
        var srsResult = CreateSRSResult(1, 0, 1.96m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        flashcard.SRSRepetitions.Should().Be(0, "failing grade should reset repetitions");
        flashcard.SRSInterval.Should().Be(1, "failing grade should reset interval to 1 day");
    }

    [Fact]
    public async Task Handle_ShouldMaintainProgress_WithPassingGrade()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.CorrectAfterHesitation;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId, easeFactor: 2.0m, repetitions: 5);
        var srsResult = CreateSRSResult(60, 6, 2.0m, DateTime.UtcNow.AddDays(60));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        flashcard.SRSRepetitions.Should().Be(6, "passing grade should increment repetitions");
        flashcard.SRSInterval.Should().BeGreaterThan(1, "passing grade should increase interval");
    }

    [Fact]
    public async Task Handle_ShouldUpdateTimestamp_WhenFlashcardIsRated()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var oldUpdatedAt = flashcard.UpdatedAtUtc;
        var srsResult = CreateSRSResult(1, 1, 2.5m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        flashcard.UpdatedAtUtc.Should().BeAfter(oldUpdatedAt);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task Handle_ShouldHandleVeryLargeFlashcardId()
    {
        // Arrange
        var flashcardId = int.MaxValue;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);

        var flashcard = CreateFlashcard(flashcardId, userId);
        var srsResult = CreateSRSResult(1, 1, 2.5m, DateTime.UtcNow.AddDays(1));
        var responseDto = new RateFlashcardResponseDto();

        SetupMocks(flashcard, srsResult, responseDto);

        // Act
        var act = async () => await _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Handle_ShouldRespectCancellationToken()
    {
        // Arrange
        var flashcardId = 1;
        var userId = 1;
        var grade = SRSGrade.PerfectResponse;
        var command = new RateFlashcardCommand(flashcardId, userId, grade);
        var cts = new CancellationTokenSource();
        cts.Cancel();

        _mockFlashcardRepository.GetByIdAsync(flashcardId, userId, Arg.Any<CancellationToken>())
            .Returns(callInfo => Task.FromException<Flashcard?>(
                new OperationCanceledException(callInfo.Arg<CancellationToken>())));

        // Act
        var act = async () => await _sut.Handle(command, cts.Token);

        // Assert
        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    #endregion

    #region Helper Methods

    private static Flashcard CreateFlashcard(
        int id,
        int userId,
        decimal? easeFactor = 2.5m,
        int? repetitions = 0)
    {
        return new Flashcard
        {
            Id = id,
            UserId = userId,
            Question = "Test Question",
            Answer = "Test Answer",
            Source = FlashcardSource.Manual,
            Status = FlashcardStatus.NotApplicable,
            SRSInterval = 1,
            SRSRepetitions = repetitions,
            SRSEaseFactor = easeFactor,
            SRSNextRepetitionDate = DateTime.UtcNow.AddDays(-1),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-7),
            UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
        };
    }

    private static SRSCalculationResult CreateSRSResult(
        int interval,
        int repetitions,
        decimal easeFactor,
        DateTime nextRepetitionDate)
    {
        return new SRSCalculationResult
        {
            Interval = interval,
            Repetitions = repetitions,
            EaseFactor = easeFactor,
            NextRepetitionDate = nextRepetitionDate
        };
    }

    private void SetupMocks(Flashcard flashcard, SRSCalculationResult srsResult, RateFlashcardResponseDto responseDto)
    {
        _mockFlashcardRepository.GetByIdAsync(flashcard.Id, flashcard.UserId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<Flashcard?>(flashcard));

        _mockSpacedRepetitionService.CalculateNextReview(
            Arg.Any<decimal>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<DateTime>())
            .Returns(srsResult);

        _mockUnitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(1));

        _mockMapper.Map<RateFlashcardResponseDto>(Arg.Any<Flashcard>())
            .Returns(responseDto);
    }

    #endregion
}
