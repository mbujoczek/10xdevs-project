using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;
using _10xdevs.Application.Interfaces;

namespace _10xdevs.Infrastructure.Services;

public class OpenRouterService : IFlashcardAIService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenRouterService> _logger;
    private readonly string _apiKey;
    private const string DefaultModel = "mistralai/mistral-7b-instruct";

    public OpenRouterService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<OpenRouterService> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // Configure HttpClient
        var baseUrl = configuration["OpenRouter:BaseUrl"]
            ?? throw new AIServiceConfigurationException("OpenRouter:BaseUrl is not configured in appsettings.json");
        _httpClient.BaseAddress = new Uri(baseUrl);

        _apiKey = configuration["OpenRouter:ApiKey"]
            ?? throw new AIServiceConfigurationException("OpenRouter:ApiKey not found in configuration.");

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        var referer = configuration["OpenRouter:Referer"];
        if (!string.IsNullOrEmpty(referer))
        {
            _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", referer);
        }
    }

    public async Task<List<FlashcardCandidateDto>> GenerateFlashcardsAsync(
        string inputText,
        string language,
        CancellationToken cancellationToken = default)
    {
        // Validate input parameters
        if (string.IsNullOrWhiteSpace(inputText))
        {
            throw new ArgumentException("Input text cannot be null or empty.", nameof(inputText));
        }

        if (string.IsNullOrWhiteSpace(language))
        {
            throw new ArgumentException("Language cannot be null or empty.", nameof(language));
        }

        _logger.LogInformation("Generating flashcards for language: {Language}, text length: {TextLength}",
            language, inputText.Length);

        try
        {
            // Build prompts
            var systemPrompt = BuildSystemPrompt(language);
            var userPrompt = BuildUserPrompt(inputText);

            // Create request payload
            var payload = CreateFlashcardGenerationPayload(systemPrompt, userPrompt, DefaultModel);
            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            // Send request to OpenRouter API
            var response = await _httpClient.PostAsync("chat/completions", content, cancellationToken);

            // Handle API errors
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("OpenRouter API error. Status: {StatusCode}, Content: {ErrorContent}",
                    response.StatusCode, errorContent);

                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    throw new AIServiceConfigurationException("Invalid OpenRouter API key. Please check your configuration.");
                }

                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    throw new AIServiceUnavailableException("OpenRouter API rate limit exceeded. Please try again later.");
                }

                throw new AIServiceUnavailableException($"OpenRouter API returned error: {response.StatusCode}");
            }

            // Parse response
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogDebug("OpenRouter API response: {Response}", responseContent);

            var apiResponse = JsonSerializer.Deserialize<OpenRouterResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (apiResponse?.Choices == null || apiResponse.Choices.Count == 0)
            {
                throw new AIServiceUnavailableException("OpenRouter API returned empty response.");
            }

            var messageContent = apiResponse.Choices[0].Message?.Content;
            if (string.IsNullOrWhiteSpace(messageContent))
            {
                throw new AIServiceUnavailableException("OpenRouter API returned empty message content.");
            }

            // Parse flashcards from JSON response
            var flashcardsResponse = JsonSerializer.Deserialize<FlashcardsResponse>(messageContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (flashcardsResponse?.Flashcards == null || flashcardsResponse.Flashcards.Count == 0)
            {
                throw new AIServiceUnavailableException("Failed to parse flashcards from AI response.");
            }

            // Map to DTOs
            var result = flashcardsResponse.Flashcards
                .Select(f => new FlashcardCandidateDto
                {
                    CandidateId = Guid.NewGuid().ToString(),
                    Question = f.Question,
                    Answer = f.Answer
                })
                .ToList();

            _logger.LogInformation("Successfully generated {Count} flashcards", result.Count);
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error while communicating with OpenRouter API");
            throw new AIServiceUnavailableException("Failed to communicate with AI service due to network error.", ex);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Request to OpenRouter API timed out");
            throw new AIServiceUnavailableException("AI service request timed out.", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse OpenRouter API response");
            throw new AIServiceUnavailableException("Failed to parse AI service response.", ex);
        }
    }

    private string BuildSystemPrompt(string language)
    {
        var languageName = language.ToLower() switch
        {
            "pl" => "Polish",
            "en" => "English",
            _ => "English"
        };

        return $@"You are an expert in creating educational flashcards for spaced repetition learning.
Your task is to generate exactly 5 high-quality flashcards in {languageName} from the provided text.

Rules:
1. Each flashcard must have a clear question and a concise answer
2. Questions should test understanding, not just memorization
3. Answers should be brief but complete (1-3 sentences)
4. Focus on the most important concepts from the text
5. Use simple, clear language
6. Return the response in JSON format with a 'flashcards' array containing objects with 'question' and 'answer' fields

Generate exactly 5 flashcards.";
    }

    private string BuildUserPrompt(string inputText)
    {
        return $@"Generate 5 flashcards from the following text:

{inputText}";
    }

    private object CreateFlashcardGenerationPayload(string systemPrompt, string userPrompt, string modelName)
    {
        var schema = new
        {
            type = "object",
            properties = new
            {
                flashcards = new
                {
                    type = "array",
                    items = new
                    {
                        type = "object",
                        properties = new
                        {
                            question = new { type = "string" },
                            answer = new { type = "string" }
                        },
                        required = new[] { "question", "answer" }
                    }
                }
            },
            required = new[] { "flashcards" }
        };

        return new
        {
            model = modelName,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            response_format = new
            {
                type = "json_schema",
                json_schema = new
                {
                    name = "flashcard_generator_schema",
                    strict = true,
                    schema = schema
                }
            },
            temperature = 0.7
        };
    }

    // Internal DTOs for API communication
    private class OpenRouterResponse
    {
        public List<Choice> Choices { get; set; } = new();
    }

    private class Choice
    {
        public Message? Message { get; set; }
    }

    private class Message
    {
        public string? Content { get; set; }
    }

    private class FlashcardsResponse
    {
        public List<FlashcardItem> Flashcards { get; set; } = new();
    }

    private class FlashcardItem
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
    }
}
