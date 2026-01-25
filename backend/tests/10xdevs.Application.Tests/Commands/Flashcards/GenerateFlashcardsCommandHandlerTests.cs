using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using _10xdevs.Application.Commands.Flashcards.GenerateFlashcards;
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;
using _10xdevs.Application.Interfaces;
using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Interfaces;

namespace _10xdevs.Application.Tests.Commands.Flashcards;

/// <summary>
/// Unit tests for GenerateFlashcardsCommandHandler
/// Tests CQRS command handler with mocked dependencies (AI service and repository)
/// Following xUnit, NSubstitute, and FluentAssertions best practices
/// </summary>
public class GenerateFlashcardsCommandHandlerTests
{
    private readonly IFlashcardAIService _mockAiService;
    private readonly IFlashcardGenerationEventRepository _mockEventRepository;
    private readonly ILogger<GenerateFlashcardsCommandHandler> _mockLogger;
    private readonly GenerateFlashcardsCommandHandler _handler;

    public GenerateFlashcardsCommandHandlerTests()
    {
        _mockAiService = Substitute.For<IFlashcardAIService>();
        _mockEventRepository = Substitute.For<IFlashcardGenerationEventRepository>();
        _mockLogger = Substitute.For<ILogger<GenerateFlashcardsCommandHandler>>();

        _handler = new GenerateFlashcardsCommandHandler(
            _mockAiService,
            _mockEventRepository,
            _mockLogger);
    }

    #region Constructor Tests

    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenAiServiceIsNull()
    {
        // Act
        var act = () => new GenerateFlashcardsCommandHandler(
            null!,
            _mockEventRepository,
            _mockLogger);

        // Assert
        act.Should().Throw<ArgumentNullException>()
            .WithParameterName("aiService");
    }

    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenEventRepositoryIsNull()
    {
        // Act
        var act = () => new GenerateFlashcardsCommandHandler(
            _mockAiService,
            null!,
            _mockLogger);

        // Assert
        act.Should().Throw<ArgumentNullException>()
            .WithParameterName("eventRepository");
    }

    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenLoggerIsNull()
    {
        // Act
        var act = () => new GenerateFlashcardsCommandHandler(
            _mockAiService,
            _mockEventRepository,
            null!);

        // Assert
        act.Should().Throw<ArgumentNullException>()
            .WithParameterName("logger");
    }

    #endregion

    #region Handle - Success Scenarios

    [Fact]
    public async Task Handle_ShouldReturnValidResponse_WhenFlashcardsGeneratedSuccessfully()
    {
        // Arrange
        var userId = 1;
        var command = new GenerateFlashcardsCommand
        {
            UserId = userId,
            InputText = "Vue.js is a progressive JavaScript framework for building user interfaces.",
            Language = "en"
        };

        var aiCandidates = new List<FlashcardCandidateDto>
        {
            new() { CandidateId = "ai-1", Question = "What is Vue.js?", Answer = "A progressive JavaScript framework" },
            new() { CandidateId = "ai-2", Question = "What is Vue used for?", Answer = "Building user interfaces" },
            new() { CandidateId = "ai-3", Question = "What type of framework is Vue?", Answer = "Progressive framework" },
            new() { CandidateId = "ai-4", Question = "What language is Vue based on?", Answer = "JavaScript" },
            new() { CandidateId = "ai-5", Question = "Is Vue a framework or library?", Answer = "Framework" }
        };

        var savedEvent = new FlashcardGenerationEvent
        {
            Id = 1,
            UserId = userId,
            CandidatesCount = 5,
            AcceptedCount = 0,
            EditedCount = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _mockAiService.GenerateFlashcardsAsync(
            command.InputText,
            command.Language,
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .Returns(savedEvent);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.GenerationEventId.Should().Be(savedEvent.Id);
        result.Candidates.Should().HaveCount(5);
        result.CandidatesCount.Should().Be(5);
        result.CreatedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        // Verify all candidates have temporary IDs
        result.Candidates.Should().AllSatisfy(c =>
        {
            c.CandidateId.Should().StartWith("temp-");
        });

        // Verify AI service was called with correct parameters
        await _mockAiService.Received(1).GenerateFlashcardsAsync(
            command.InputText,
            command.Language,
            Arg.Any<CancellationToken>());

        // Verify repository was called once
        await _mockEventRepository.Received(1).CreateAsync(
            Arg.Is<FlashcardGenerationEvent>(e =>
                e.UserId == userId &&
                e.CandidatesCount == 5 &&
                e.AcceptedCount == 0 &&
                e.EditedCount == 0),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldAssignTemporaryIds_ToAllCandidates()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        var aiCandidates = new List<FlashcardCandidateDto>
        {
            new() { Question = "Q1", Answer = "A1" },
            new() { Question = "Q2", Answer = "A2" },
            new() { Question = "Q3", Answer = "A3" }
        };

        var savedEvent = new FlashcardGenerationEvent
        {
            Id = 1,
            UserId = command.UserId,
            CandidatesCount = 3,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .Returns(savedEvent);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Candidates[0].CandidateId.Should().Be("temp-1");
        result.Candidates[1].CandidateId.Should().Be("temp-2");
        result.Candidates[2].CandidateId.Should().Be("temp-3");
    }

    [Fact]
    public async Task Handle_ShouldPreserveOriginalQuestionAndAnswer_FromAiService()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "pl"
        };

        var aiCandidates = new List<FlashcardCandidateDto>
        {
            new() { Question = "Czym jest TypeScript?", Answer = "JavaScript z typami" }
        };

        var savedEvent = new FlashcardGenerationEvent
        {
            Id = 1,
            UserId = command.UserId,
            CandidatesCount = 1,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .Returns(savedEvent);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Candidates[0].Question.Should().Be("Czym jest TypeScript?");
        result.Candidates[0].Answer.Should().Be("JavaScript z typami");
    }

    [Fact]
    public async Task Handle_ShouldCreateEventWithCorrectInitialCounters()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        var aiCandidates = new List<FlashcardCandidateDto>
        {
            new() { Question = "Q1", Answer = "A1" },
            new() { Question = "Q2", Answer = "A2" }
        };

        var savedEvent = new FlashcardGenerationEvent
        {
            Id = 1,
            UserId = command.UserId,
            CandidatesCount = 2,
            AcceptedCount = 0,
            EditedCount = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .Returns(savedEvent);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        await _mockEventRepository.Received(1).CreateAsync(
            Arg.Is<FlashcardGenerationEvent>(e =>
                e.CandidatesCount == 2 &&
                e.AcceptedCount == 0 &&
                e.EditedCount == 0),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldHandleDifferentLanguages()
    {
        // Arrange
        var testCases = new[] { "en", "pl", "de", "fr" };

        foreach (var language in testCases)
        {
            var command = new GenerateFlashcardsCommand
            {
                UserId = 1,
                InputText = "Test input",
                Language = language
            };

            var aiCandidates = new List<FlashcardCandidateDto>
            {
                new() { Question = "Q1", Answer = "A1" }
            };

            var savedEvent = new FlashcardGenerationEvent
            {
                Id = 1,
                UserId = command.UserId,
                CandidatesCount = 1,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };

            _mockAiService.ClearReceivedCalls();
            _mockEventRepository.ClearReceivedCalls();

            _mockAiService.GenerateFlashcardsAsync(
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<CancellationToken>())
                .Returns(aiCandidates);

            _mockEventRepository.CreateAsync(
                Arg.Any<FlashcardGenerationEvent>(),
                Arg.Any<CancellationToken>())
                .Returns(savedEvent);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            await _mockAiService.Received(1).GenerateFlashcardsAsync(
                command.InputText,
                language,
                Arg.Any<CancellationToken>());
        }
    }

    #endregion

    #region Handle - Error Scenarios

    [Fact]
    public async Task Handle_ShouldThrowException_WhenAiServiceFails()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .ThrowsAsync(new AIServiceUnavailableException("AI service is down"));

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<AIServiceUnavailableException>()
            .WithMessage("*AI service is down*");

        // Verify repository was never called
        await _mockEventRepository.DidNotReceive().CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenRepositoryFails()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        var aiCandidates = new List<FlashcardCandidateDto>
        {
            new() { Question = "Q1", Answer = "A1" }
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Database connection failed*");
    }

    [Fact]
    public async Task Handle_ShouldThrowAIServiceConfigurationException_WhenApiKeyIsInvalid()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .ThrowsAsync(new AIServiceConfigurationException("Invalid API key"));

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<AIServiceConfigurationException>()
            .WithMessage("*Invalid API key*");
    }

    #endregion

    #region Handle - CancellationToken Tests

    [Fact]
    public async Task Handle_ShouldPassCancellationToken_ToAiService()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        var aiCandidates = new List<FlashcardCandidateDto>
        {
            new() { Question = "Q1", Answer = "A1" }
        };

        var savedEvent = new FlashcardGenerationEvent
        {
            Id = 1,
            UserId = command.UserId,
            CandidatesCount = 1,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .Returns(savedEvent);

        var cts = new CancellationTokenSource();

        // Act
        await _handler.Handle(command, cts.Token);

        // Assert
        await _mockAiService.Received(1).GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            cts.Token);

        await _mockEventRepository.Received(1).CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            cts.Token);
    }

    [Fact]
    public async Task Handle_ShouldRespectCancellation_WhenTokenIsCancelled()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        var cts = new CancellationTokenSource();
        cts.Cancel();

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .ThrowsAsync(new TaskCanceledException());

        // Act
        var act = async () => await _handler.Handle(command, cts.Token);

        // Assert
        await act.Should().ThrowAsync<TaskCanceledException>();
    }

    #endregion

    #region Handle - Edge Cases

    [Fact]
    public async Task Handle_ShouldHandleEmptyCandidatesList()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        var aiCandidates = new List<FlashcardCandidateDto>(); // Empty list

        var savedEvent = new FlashcardGenerationEvent
        {
            Id = 1,
            UserId = command.UserId,
            CandidatesCount = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .Returns(savedEvent);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Candidates.Should().BeEmpty();
        result.CandidatesCount.Should().Be(0);

        await _mockEventRepository.Received(1).CreateAsync(
            Arg.Is<FlashcardGenerationEvent>(e => e.CandidatesCount == 0),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldHandleLongInputText()
    {
        // Arrange
        var longText = string.Join(" ", Enumerable.Repeat("This is a very long text.", 1000));
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = longText,
            Language = "en"
        };

        var aiCandidates = new List<FlashcardCandidateDto>
        {
            new() { Question = "Q1", Answer = "A1" }
        };

        var savedEvent = new FlashcardGenerationEvent
        {
            Id = 1,
            UserId = command.UserId,
            CandidatesCount = 1,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .Returns(savedEvent);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        await _mockAiService.Received(1).GenerateFlashcardsAsync(
            longText,
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldHandleSpecialCharactersInQuestionAndAnswer()
    {
        // Arrange
        var command = new GenerateFlashcardsCommand
        {
            UserId = 1,
            InputText = "Test input",
            Language = "en"
        };

        var aiCandidates = new List<FlashcardCandidateDto>
        {
            new()
            {
                Question = "What is <script>alert('XSS')</script>?",
                Answer = "HTML injection & \"dangerous\" code"
            }
        };

        var savedEvent = new FlashcardGenerationEvent
        {
            Id = 1,
            UserId = command.UserId,
            CandidatesCount = 1,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _mockAiService.GenerateFlashcardsAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>())
            .Returns(aiCandidates);

        _mockEventRepository.CreateAsync(
            Arg.Any<FlashcardGenerationEvent>(),
            Arg.Any<CancellationToken>())
            .Returns(savedEvent);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Candidates[0].Question.Should().Contain("<script>");
        result.Candidates[0].Answer.Should().Contain("&");
        result.Candidates[0].Answer.Should().Contain("\"dangerous\"");
    }

    #endregion
}
