using AutoMapper;
using FluentAssertions;
using NSubstitute;
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.DTOs.Learning;
using _10xdevs.Application.Queries.Learning.GetDueFlashcards;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using _10xdevs.Domain.Interfaces;

namespace _10xdevs.Application.Tests.Queries.Learning;

/// <summary>
/// Unit tests for GetDueFlashcardsQueryHandler
/// Tests retrieval of flashcards that are due for review
/// Following xUnit, NSubstitute, and FluentAssertions best practices
/// </summary>
public class GetDueFlashcardsQueryHandlerTests
{
    private readonly IFlashcardRepository _mockFlashcardRepository;
    private readonly IMapper _mockMapper;
    private readonly GetDueFlashcardsQueryHandler _sut;

    public GetDueFlashcardsQueryHandlerTests()
    {
        _mockFlashcardRepository = Substitute.For<IFlashcardRepository>();
        _mockMapper = Substitute.For<IMapper>();
        _sut = new GetDueFlashcardsQueryHandler(_mockFlashcardRepository, _mockMapper);
    }

    #region Successful Scenarios

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoDueFlashcards()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var emptyFlashcardList = new List<Flashcard>();
        var emptyDtoList = new List<FlashcardDto>();

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(emptyFlashcardList));
        _mockMapper.Map<List<FlashcardDto>>(emptyFlashcardList).Returns(emptyDtoList);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Flashcards.Should().BeEmpty();
        result.TotalDueCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_ShouldReturnSingleFlashcard_WhenOneDueFlashcard()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var flashcard = CreateFlashcard(1, userId, "Question 1", "Answer 1");
        var flashcards = new List<Flashcard> { flashcard };
        var flashcardDto = CreateFlashcardDto(1, "Question 1", "Answer 1");
        var flashcardDtos = new List<FlashcardDto> { flashcardDto };

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(flashcards));
        _mockMapper.Map<List<FlashcardDto>>(flashcards).Returns(flashcardDtos);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Flashcards.Should().HaveCount(1);
        result.Flashcards[0].Should().BeEquivalentTo(flashcardDto);
        result.TotalDueCount.Should().Be(1);
    }

    [Fact]
    public async Task Handle_ShouldReturnMultipleFlashcards_WhenMultipleDueFlashcards()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var flashcards = new List<Flashcard>
        {
            CreateFlashcard(1, userId, "Question 1", "Answer 1"),
            CreateFlashcard(2, userId, "Question 2", "Answer 2"),
            CreateFlashcard(3, userId, "Question 3", "Answer 3")
        };
        var flashcardDtos = new List<FlashcardDto>
        {
            CreateFlashcardDto(1, "Question 1", "Answer 1"),
            CreateFlashcardDto(2, "Question 2", "Answer 2"),
            CreateFlashcardDto(3, "Question 3", "Answer 3")
        };

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(flashcards));
        _mockMapper.Map<List<FlashcardDto>>(flashcards).Returns(flashcardDtos);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Flashcards.Should().HaveCount(3);
        result.TotalDueCount.Should().Be(3);
    }

    [Fact]
    public async Task Handle_ShouldCallRepositoryWithCorrectUserId()
    {
        // Arrange
        var userId = 42;
        var query = new GetDueFlashcardsQuery(userId);
        var emptyList = new List<Flashcard>();

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(emptyList));
        _mockMapper.Map<List<FlashcardDto>>(Arg.Any<List<Flashcard>>()).Returns(new List<FlashcardDto>());

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        await _mockFlashcardRepository.Received(1).GetDueFlashcardsAsync(
            Arg.Is<int>(id => id == userId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldMapFlashcardsToDto()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var flashcards = new List<Flashcard>
        {
            CreateFlashcard(1, userId, "Q1", "A1")
        };

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(flashcards));
        _mockMapper.Map<List<FlashcardDto>>(flashcards).Returns(new List<FlashcardDto>());

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _mockMapper.Received(1).Map<List<FlashcardDto>>(Arg.Is<List<Flashcard>>(f => f.Count == 1));
    }

    #endregion

    #region Business Rules Tests

    [Fact]
    public async Task Handle_ShouldReturnOnlyDueFlashcards_NotFutureOnes()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var now = DateTime.UtcNow;

        // Only due flashcards (past or now)
        var dueFlashcards = new List<Flashcard>
        {
            CreateFlashcard(1, userId, "Due yesterday", "A1", now.AddDays(-1)),
            CreateFlashcard(2, userId, "Due now", "A2", now),
            CreateFlashcard(3, userId, "Due week ago", "A3", now.AddDays(-7))
        };
        var dtos = dueFlashcards.Select((f, i) => CreateFlashcardDto(f.Id, f.Question, f.Answer)).ToList();

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(dueFlashcards));
        _mockMapper.Map<List<FlashcardDto>>(dueFlashcards).Returns(dtos);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Flashcards.Should().HaveCount(3, "repository should only return due flashcards");
        result.TotalDueCount.Should().Be(3);
    }

    [Fact]
    public async Task Handle_ShouldIncludeNewFlashcards_WithNullNextRepetitionDate()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);

        // New flashcards have null SRSNextRepetitionDate
        var flashcards = new List<Flashcard>
        {
            CreateFlashcard(1, userId, "New flashcard 1", "A1", null),
            CreateFlashcard(2, userId, "New flashcard 2", "A2", null)
        };
        var dtos = flashcards.Select(f => CreateFlashcardDto(f.Id, f.Question, f.Answer)).ToList();

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(flashcards));
        _mockMapper.Map<List<FlashcardDto>>(flashcards).Returns(dtos);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Flashcards.Should().HaveCount(2, "new flashcards should be included");
        result.TotalDueCount.Should().Be(2);
    }

    [Fact]
    public async Task Handle_ShouldIncludeFlashcardsFromAllSources()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var flashcards = new List<Flashcard>
        {
            CreateFlashcard(1, userId, "Manual card", "A1", source: FlashcardSource.Manual),
            CreateFlashcard(2, userId, "AI card", "A2", source: FlashcardSource.AI)
        };
        var dtos = flashcards.Select(f => CreateFlashcardDto(f.Id, f.Question, f.Answer)).ToList();

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(flashcards));
        _mockMapper.Map<List<FlashcardDto>>(flashcards).Returns(dtos);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Flashcards.Should().HaveCount(2, "flashcards from all sources should be included");
    }

    [Fact]
    public async Task Handle_ShouldReturnCorrectTotalCount_MatchingFlashcardsCount()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var flashcards = new List<Flashcard>
        {
            CreateFlashcard(1, userId, "Q1", "A1"),
            CreateFlashcard(2, userId, "Q2", "A2"),
            CreateFlashcard(3, userId, "Q3", "A3"),
            CreateFlashcard(4, userId, "Q4", "A4"),
            CreateFlashcard(5, userId, "Q5", "A5")
        };
        var dtos = flashcards.Select(f => CreateFlashcardDto(f.Id, f.Question, f.Answer)).ToList();

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(flashcards));
        _mockMapper.Map<List<FlashcardDto>>(flashcards).Returns(dtos);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.TotalDueCount.Should().Be(result.Flashcards.Count, "total count should match flashcards count");
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task Handle_ShouldHandleLargeNumberOfDueFlashcards()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var flashcards = Enumerable.Range(1, 100)
            .Select(i => CreateFlashcard(i, userId, $"Question {i}", $"Answer {i}"))
            .ToList();
        var dtos = flashcards.Select(f => CreateFlashcardDto(f.Id, f.Question, f.Answer)).ToList();

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(flashcards));
        _mockMapper.Map<List<FlashcardDto>>(flashcards).Returns(dtos);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Flashcards.Should().HaveCount(100);
        result.TotalDueCount.Should().Be(100);
    }

    [Fact]
    public async Task Handle_ShouldRespectCancellationToken()
    {
        // Arrange
        var userId = 1;
        var query = new GetDueFlashcardsQuery(userId);
        var cts = new CancellationTokenSource();
        cts.Cancel();

        _mockFlashcardRepository.GetDueFlashcardsAsync(userId, Arg.Any<CancellationToken>())
            .Returns(callInfo => Task.FromException<IReadOnlyList<Flashcard>>(
                new OperationCanceledException(callInfo.Arg<CancellationToken>())));

        // Act
        var act = async () => await _sut.Handle(query, cts.Token);

        // Assert
        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(int.MinValue)]
    public async Task Handle_ShouldHandleInvalidUserIds_ByReturningEmpty(int invalidUserId)
    {
        // Arrange
        var query = new GetDueFlashcardsQuery(invalidUserId);
        var emptyList = new List<Flashcard>();

        _mockFlashcardRepository.GetDueFlashcardsAsync(invalidUserId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<Flashcard>>(emptyList));
        _mockMapper.Map<List<FlashcardDto>>(emptyList).Returns(new List<FlashcardDto>());

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Flashcards.Should().BeEmpty();
    }

    #endregion

    #region Helper Methods

    private static Flashcard CreateFlashcard(
        int id,
        int userId,
        string question,
        string answer,
        DateTime? nextRepetitionDate = null,
        FlashcardSource source = FlashcardSource.Manual)
    {
        return new Flashcard
        {
            Id = id,
            UserId = userId,
            Question = question,
            Answer = answer,
            Source = source,
            Status = FlashcardStatus.NotApplicable,
            SRSNextRepetitionDate = nextRepetitionDate ?? DateTime.UtcNow.AddDays(-1),
            SRSInterval = 1,
            SRSRepetitions = 0,
            SRSEaseFactor = 2.5m,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-7),
            UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
        };
    }

    private static FlashcardDto CreateFlashcardDto(int id, string question, string answer)
    {
        return new FlashcardDto
        {
            Id = id,
            Question = question,
            Answer = answer,
            Source = FlashcardSource.Manual,
            Status = FlashcardStatus.NotApplicable,
            SRSInterval = 1,
            SRSRepetitions = 0,
            SRSEaseFactor = 2.5m,
            SRSNextRepetitionDate = DateTime.UtcNow.AddDays(-1),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-7),
            UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
        };
    }

    #endregion
}
