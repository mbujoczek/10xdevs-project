# OpenRouter Service Implementation Guide

## 1. Service Description

`OpenRouterService` is an infrastructure layer service responsible for communicating with the external OpenRouter API. Its purpose is to replace the existing `FlashcardAIService` (which uses Ollama) and provide a more reliable and flexible mechanism for content generation by language models (LLM).

The service will encapsulate the logic related to creating requests, sending them to the OpenRouter API, handling responses (including structured JSON data), and managing errors. It will be designed generically to support various AI tasks in the future, not just flashcard generation.

## 2. Constructor Description

The service's constructor will inject all necessary dependencies, following the Dependency Injection principles used in the project.

```csharp
public class OpenRouterService : IFlashcardAIService // or a more generic interface, e.g., IAIService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenRouterService> _logger;
    private readonly string _apiKey;

    public OpenRouterService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<OpenRouterService> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // Configure HttpClient
        _httpClient.BaseAddress = new Uri("https://openrouter.ai/api/v1/");
        _apiKey = configuration["OpenRouter:ApiKey"] ?? throw new ArgumentNullException("OpenRouter:ApiKey not found in configuration.");
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", configuration["OpenRouter:Referer"]); // Optional, but recommended
    }
}
```

**Dependencies:**

- `HttpClient`: For sending HTTP requests to the API.
- `IConfiguration`: For reading the API key and other configuration parameters from `appsettings.json`.
- `ILogger<OpenRouterService>`: For logging information about operations and any errors.

## 3. Public Methods and Fields

The main public method will be the implementation of the `IFlashcardAIService` interface.

### `Task<List<FlashcardCandidateDto>> GenerateFlashcardsAsync(string inputText, string language, CancellationToken cancellationToken)`

This method will be responsible for generating flashcards based on the provided text and language.

**Logic:**

1. Validate input parameters (`inputText`, `language`).
2. Build a system prompt instructing the model on its role and the expected response format.
3. Build a user prompt containing the text to be processed.
4. Define the JSON schema for the response using `response_format`.
5. Select the appropriate LLM model based on language or other criteria.
6. Assemble the full request payload for the `/chat/completions` endpoint.
7. Send the request to the OpenRouter API.
8. Deserialize the JSON response into DTO objects.
9. Map the results and return a list of `FlashcardCandidateDto`.

## 4. Private Methods and Fields

### Fields

- `_httpClient`: HttpClient instance.
- `_logger`: Logger instance.
- `_apiKey`: API key for authorization.

### Methods

#### `string BuildSystemPrompt(string language)`

Creates a system prompt in the appropriate language, instructing the model to act as an expert in creating flashcards.

#### `string BuildUserPrompt(string inputText)`

Creates a user prompt containing the source text for analysis.

#### `object CreateFlashcardGenerationPayload(string systemPrompt, string userPrompt, string modelName)`

Creates an anonymous object or a dedicated DTO class representing the request body (payload) for the OpenRouter API. This is where the `response_format` with the JSON schema is defined.

**Example `response_format` implementation:**

```csharp
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

var payload = new
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
            strict = true, // Enforces strict adherence to the schema
            schema = schema
        }
    },
    temperature = 0.7
};
```

## 5. Error Handling

Robust error handling must be implemented, covering both network communication issues and errors returned by the OpenRouter API.

1.  **Network and Timeout Errors (`HttpRequestException`, `TaskCanceledException`):**

    - Log the error.
    - Throw a dedicated `AIServiceUnavailableException` with a message that the AI service is unavailable.

2.  **OpenRouter API Errors (status `4xx`, `5xx`):**

    - Read the error response body from the API, which often contains useful diagnostic information.
    - Log the status code and error content.
    - For status `401 Unauthorized`: Throw `AIServiceConfigurationException` with a message about a likely invalid API key.
    - For status `429 Too Many Requests`: Implement a retry mechanism with exponential backoff.
    - For other errors: Throw `AIServiceUnavailableException` with the error message from the API.

3.  **JSON Parsing Errors (`JsonException`):**
    - Despite using `response_format`, be prepared for potential deserialization problems.
    - Log the error and the raw response from the API.
    - Throw `AIServiceUnavailableException` with a message about an invalid response format.

## 6. Security Considerations

1.  **API Key Management:**

    - The API key (`OpenRouter:ApiKey`) **must** be stored in a secure location. In a development environment, use `secrets.json`. In production, use Azure Key Vault or another secure secret store.
    - **Never** hardcode the API key in the source code or in version-controlled `appsettings.json` files.

2.  **Input Validation:**

    - Before sending data to the API, validate it to prevent prompt injection attacks. While difficult, basic sanitization (e.g., limiting text length) is recommended.

3.  **Logging:**
    - Be careful not to log full user inputs if they might contain sensitive information. Log metadata (e.g., text length) instead of the content itself.

## 7. Step-by-Step Implementation Plan

1.  **Project Configuration:**
    a. Add entries to `appsettings.Development.json` for OpenRouter configuration:
    `json
    "OpenRouter": {
      "ApiKey": "your_api_key_from_user_secrets",
      "Referer": "http://localhost:5000" // or your application's address
    }
    `
    b. Add the API key to the secret manager for the `10xdevs.Api` project:
    `bash
    dotnet user-secrets set "OpenRouter:ApiKey" "sk-or-v1-..."
    `

2.  **Create the New Service:**
    a. In the `10xdevs.Infrastructure` project, create a new file `Services/OpenRouterService.cs`.
    b. Implement the `OpenRouterService` class as described in sections 2, 3, and 4 of this guide.
    c. Create private DTO classes for request serialization and response deserialization to avoid using anonymous types in the final code.

3.  **Register the Service in the DI Container:**
    a. In the `10xdevs.Api` project, in `Program.cs` (or the appropriate `IServiceCollection` extension method), change the `IFlashcardAIService` registration:
    ```csharp
    // Remove or comment out the old registration
    // services.AddScoped<IFlashcardAIService, FlashcardAIService>();

        // Add the new registration
        services.AddScoped<IFlashcardAIService, OpenRouterService>();
        ```

4.  **Implement Flashcard Generation Logic:**
    a. In `OpenRouterService.GenerateFlashcardsAsync`, implement the full logic described in section 3.
    b. Pay close attention to the correct construction of the `response_format` object, as this is key to getting reliable, structured responses and avoiding the complex parsing that was an issue in `FlashcardAIService`.
    c. Choose a model, e.g., `mistralai/mistral-7b-instruct`, as the default, which handles instructions and JSON format well.

5.  **Error Handling and Logging:**
    a. Implement a `try-catch` block around the `_httpClient.PostAsync` call.
    b. Handle `HttpRequestException`, `TaskCanceledException`, and `JsonException` as described in section 5.
    c. Add logging at key stages: before sending the request, after receiving the response, and for any errors.

6.  **Testing:**
    a. Run the application and test the flashcard generation functionality from the UI or using Swagger.
    b. Check the logs to ensure that communication with the API is proceeding correctly.
    c. Test error scenarios, e.g., by providing an invalid API key, to verify that exceptions are handled correctly.

7.  **Finalization and Cleanup of Ollama Artifacts:**
    After successfully deploying and testing `OpenRouterService`, it is crucial to remove all remnants of the previous implementation to ensure project cleanliness and consistency.

    a. **Remove the Service:**

    - Delete the file `backend/src/10xdevs.Infrastructure/Services/FlashcardAIService.cs`.

    b. **Update Configuration:**

    - In `appsettings.json` and `appsettings.Development.json`, remove the entire `Ollama` section.
    - In the secret manager (`secrets.json`), remove any entries related to Ollama.

    c. **Update Dependency Injection (DI) Registration:**

    - In `backend/src/10xdevs.Infrastructure/Extensions/ServiceCollectionExtensions.cs`, ensure the entire `services.AddHttpClient<IFlashcardAIService, FlashcardAIService>(...)` section is removed and replaced with the new configuration for `OpenRouterService`.

    d. **Update Source Code:**

    - **Exceptions:** Modify the comment in `backend/src/10xdevs.Application/Exceptions/AIServiceUnavailableException.cs` to refer generally to the "AI service" rather than specifically to Ollama.
      ```csharp
      // Before: Exception thrown when the AI service (Ollama) is unavailable...
      // After:  Exception thrown when the AI service is unavailable...
      ```
    - **Controllers:** Review comments and logs in `backend/src/10xdevs.Api/Controllers/FlashcardsController.cs` and remove any references to the old implementation.

    e. **Update Documentation:**

    - **Main `README.md`:** In the root project directory, update the `Tech Stack` table and the `Getting Started Locally` section, removing Ollama and its installation instructions.
    - **Backend `README.md`:** In the `backend/README.md` file, update the `Technology Stack`, `Prerequisites`, and `Ollama Setup` sections, replacing them with information about OpenRouter.
    - **`tech-stack` Documentation:** Update the `docs/tech-stack.en.md` and `docs/tech-stack.pl.md` files, replacing the information about Ollama in the "Artificial Intelligence (AI)" section with new details about OpenRouter.
