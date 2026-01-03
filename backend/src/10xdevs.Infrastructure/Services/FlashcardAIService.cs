using System.Text;
using System.Text.Json;
using _10xdevs.Application.DTOs.Flashcards;
using _10xdevs.Application.Exceptions;
using _10xdevs.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace _10xdevs.Infrastructure.Services;

/// <summary>
/// Service for AI-powered flashcard generation using Ollama API.
/// </summary>
public class FlashcardAIService : IFlashcardAIService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FlashcardAIService> _logger;
    private readonly string _model;

    public FlashcardAIService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<FlashcardAIService> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _model = configuration["Ollama:Model"] ?? "phi3";
    }

    /// <inheritdoc />
    public async Task<List<FlashcardCandidateDto>> GenerateFlashcardsAsync(
        string inputText,
        string language,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(inputText))
            throw new ArgumentException("Input text cannot be empty.", nameof(inputText));

        if (string.IsNullOrWhiteSpace(language))
            throw new ArgumentException("Language cannot be empty.", nameof(language));

        try
        {
            // Construct language-specific prompt
            var prompt = BuildPrompt(inputText, language);

            // Build request payload for Ollama API
            var requestPayload = new
            {
                model = _model,
                prompt,
                format = "json",
                stream = false,
                options = new
                {
                    temperature = 0.7,
                    num_predict = 2048 // Allow longer responses for 5 flashcards
                }
            };

            var requestJson = JsonSerializer.Serialize(requestPayload);
            var content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            _logger.LogInformation(
                "Sending request to Ollama API. Model: {Model}, Language: {Language}, InputLength: {InputLength}",
                _model, language, inputText.Length);

            // Send HTTP POST request to Ollama endpoint
            var response = await _httpClient.PostAsync("/api/generate", content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Ollama API returned error status code: {StatusCode}",
                    response.StatusCode);
                throw new AIServiceUnavailableException(
                    $"Ollama API returned status code: {response.StatusCode}");
            }

            // Parse response
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogInformation("Raw Ollama response: {Response}", responseContent);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var ollamaResponse = JsonSerializer.Deserialize<OllamaResponse>(responseContent, options);

            if (ollamaResponse?.Response == null)
            {
                _logger.LogError("Ollama API returned null or empty response");
                throw new AIServiceUnavailableException("Ollama API returned invalid response");
            }

            _logger.LogInformation("Extracted AI response content: {Content}", ollamaResponse.Response);

            // Parse flashcard candidates from AI response
            var candidates = ParseFlashcardCandidates(ollamaResponse.Response);

            _logger.LogInformation(
                "Successfully generated {Count} flashcard candidates",
                candidates.Count);

            return candidates;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to Ollama API");
            throw new AIServiceUnavailableException(
                "Failed to connect to AI service. Please ensure Ollama is running.", ex);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Request to Ollama API timed out");
            throw new AIServiceUnavailableException(
                "Request to AI service timed out.", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse response from Ollama API");
            throw new AIServiceUnavailableException(
                "Failed to parse AI service response.", ex);
        }
        catch (AIServiceUnavailableException)
        {
            // Re-throw AIServiceUnavailableException without wrapping
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while generating flashcards");
            throw new AIServiceUnavailableException(
                "An unexpected error occurred while generating flashcards.", ex);
        }
    }

    /// <summary>
    /// Builds a language-specific prompt for Ollama API.
    /// Requests exactly 5 flashcards in the specified language.
    /// </summary>
    private string BuildPrompt(string inputText, string language)
    {
        return language.ToLower() switch
        {
            "pl" => $"Wygeneruj dokładnie 5 fiszek z poniższego tekstu. Utwórz jasne, zwięzłe pytania z dokładnymi odpowiedziami w języku polskim. Zwróć TYLKO tablicę JSON o dokładnie takiej strukturze: [{{\"question\": \"...\", \"answer\": \"...\"}}]\n\nTekst:\n{inputText}",
            "en" => $"Generate exactly 5 flashcards from the following text. Create clear, concise questions with accurate answers in English. Return ONLY a JSON array with this exact structure: [{{\"question\": \"...\", \"answer\": \"...\"}}]\n\nText:\n{inputText}",
            _ => $"Generate exactly 5 flashcards from the following text. Create clear, concise questions with accurate answers in English. Return ONLY a JSON array with this exact structure: [{{\"question\": \"...\", \"answer\": \"...\"}}]\n\nText:\n{inputText}"
        };
    }

    /// <summary>
    /// Parses flashcard candidates from AI response JSON string.
    /// Handles multiple response formats from Ollama.
    /// </summary>
    private List<FlashcardCandidateDto> ParseFlashcardCandidates(string responseJson)
    {
        try
        {
            // Clean up the response - extract JSON content
            var cleanJson = ExtractJsonContent(responseJson);

            _logger.LogInformation("Parsing AI response. Original length: {Original}, Cleaned: {Cleaned}, Content: {Content}",
                responseJson.Length, cleanJson.Length, cleanJson);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            List<FlashcardCandidate>? flashcards = null;

            // Try multiple parsing strategies
            // 1. Try to parse as wrapper object with "flashcards" or "questions" key
            try
            {
                var wrapper = JsonSerializer.Deserialize<FlashcardWrapper>(cleanJson, options);
                flashcards = wrapper?.Flashcards ?? wrapper?.Questions;

                if (flashcards != null && flashcards.Count > 0)
                {
                    _logger.LogInformation("Successfully parsed {Count} flashcards from wrapper object", flashcards.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to parse as wrapper object");
            }

            // 2. If not successful, try direct array parsing
            if (flashcards == null || flashcards.Count == 0)
            {
                try
                {
                    flashcards = JsonSerializer.Deserialize<List<FlashcardCandidate>>(cleanJson, options);

                    if (flashcards != null && flashcards.Count > 0)
                    {
                        _logger.LogInformation("Successfully parsed {Count} flashcards as direct array", flashcards.Count);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to parse as direct array");
                }
            }

            // 3. If still not successful, try parsing as single object and wrap in list
            if (flashcards == null || flashcards.Count == 0)
            {
                try
                {
                    var singleCard = JsonSerializer.Deserialize<FlashcardCandidate>(cleanJson, options);

                    if (singleCard != null &&
                        !string.IsNullOrWhiteSpace(singleCard.Question) &&
                        !string.IsNullOrWhiteSpace(singleCard.Answer))
                    {
                        flashcards = new List<FlashcardCandidate> { singleCard };
                        _logger.LogInformation("Successfully parsed single flashcard object. Question: {Question}", singleCard.Question);
                    }
                    else
                    {
                        _logger.LogWarning("Single card parsed but invalid. Card null: {IsNull}, Question empty: {QEmpty}, Answer empty: {AEmpty}",
                            singleCard == null,
                            singleCard == null || string.IsNullOrWhiteSpace(singleCard.Question),
                            singleCard == null || string.IsNullOrWhiteSpace(singleCard.Answer));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse as single object");
                }
            }

            if (flashcards == null || flashcards.Count == 0)
            {
                _logger.LogWarning("AI returned empty flashcard list or invalid format. Response: {Response}", cleanJson);
                return new List<FlashcardCandidateDto>();
            }

            // Validate and map to DTOs
            var candidates = flashcards
                .Where(f => !string.IsNullOrWhiteSpace(f.Question) && !string.IsNullOrWhiteSpace(f.Answer))
                .Select(f => new FlashcardCandidateDto
                {
                    Question = f.Question.Trim(),
                    Answer = f.Answer.Trim(),
                    CandidateId = string.Empty // Will be set by handler
                })
                .ToList();

            if (candidates.Count == 0)
            {
                _logger.LogWarning("No valid flashcard candidates after filtering");
            }
            else
            {
                _logger.LogInformation("Successfully parsed {Count} valid flashcard candidates", candidates.Count);
            }

            return candidates;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse flashcard candidates. Response: {Response}", responseJson);
            throw new AIServiceUnavailableException("Failed to parse flashcard candidates from AI response.", ex);
        }
    }

    /// <summary>
    /// Extracts valid JSON content from the response string.
    /// Ollama sometimes wraps JSON with extra text or characters.
    /// </summary>
    private string ExtractJsonContent(string response)
    {
        // Find the first '[' or '{' character
        int startIndex = -1;
        for (int i = 0; i < response.Length; i++)
        {
            if (response[i] == '[' || response[i] == '{')
            {
                startIndex = i;
                break;
            }
        }

        if (startIndex == -1)
        {
            return response; // No JSON found, return as is
        }

        // Find the matching closing bracket/brace
        int endIndex = -1;
        int bracketCount = 0;
        char startChar = response[startIndex];
        char endChar = startChar == '[' ? ']' : '}';

        for (int i = startIndex; i < response.Length; i++)
        {
            if (response[i] == startChar)
                bracketCount++;
            else if (response[i] == endChar)
            {
                bracketCount--;
                if (bracketCount == 0)
                {
                    endIndex = i;
                    break;
                }
            }
        }

        if (endIndex == -1)
        {
            return response; // No matching bracket, return as is
        }

        return response.Substring(startIndex, endIndex - startIndex + 1);
    }

    /// <summary>
    /// Represents the response structure from Ollama API.
    /// </summary>
    private class OllamaResponse
    {
        public string Response { get; set; } = string.Empty;
    }

    /// <summary>
    /// Represents a wrapper object that Ollama may return.
    /// </summary>
    private class FlashcardWrapper
    {
        public List<FlashcardCandidate>? Flashcards { get; set; }
        public List<FlashcardCandidate>? Questions { get; set; } // phi3 sometimes uses "questions"
    }

    /// <summary>
    /// Represents a flashcard candidate structure from AI response.
    /// </summary>
    private class FlashcardCandidate
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
    }
}
