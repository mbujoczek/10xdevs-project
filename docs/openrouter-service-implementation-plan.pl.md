# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis Usługi

`OpenRouterService` to usługa warstwy infrastruktury odpowiedzialna za komunikację z zewnętrznym API OpenRouter. Jej celem jest zastąpienie istniejącej usługi `FlashcardAIService` (korzystającej z Ollama) i zapewnienie bardziej niezawodnego i elastycznego mechanizmu generowania treści przez modele językowe (LLM).

Usługa będzie hermetyzować logikę związaną z tworzeniem zapytań, wysyłaniem ich do API OpenRouter, obsługą odpowiedzi (w tym ustrukturyzowanych danych JSON) oraz zarządzaniem błędami. Będzie ona zaprojektowana w sposób generyczny, aby w przyszłości mogła obsługiwać różne zadania AI, nie tylko generowanie fiszek.

## 2. Opis Konstruktora

Konstruktor usługi będzie wstrzykiwał wszystkie niezbędne zależności, zgodnie z zasadami Dependency Injection stosowanymi w projekcie.

```csharp
public class OpenRouterService : IFlashcardAIService // lub bardziej generyczny interfejs np. IAIService
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

        // Konfiguracja klienta HTTP
        _httpClient.BaseAddress = new Uri("https://openrouter.ai/api/v1/");
        _apiKey = configuration["OpenRouter:ApiKey"] ?? throw new ArgumentNullException("OpenRouter:ApiKey not found in configuration.");
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", configuration["OpenRouter:Referer"]); // Opcjonalny, ale zalecany
    }
}
```

**Zależności:**

- `HttpClient`: Do wysyłania żądań HTTP do API.
- `IConfiguration`: Do odczytywania klucza API i innych parametrów konfiguracyjnych z `appsettings.json`.
- `ILogger<OpenRouterService>`: Do logowania informacji o przebiegu operacji i ewentualnych błędach.

## 3. Publiczne Metody i Pola

Główną metodą publiczną będzie implementacja interfejsu `IFlashcardAIService`.

### `Task<List<FlashcardCandidateDto>> GenerateFlashcardsAsync(string inputText, string language, CancellationToken cancellationToken)`

Metoda ta będzie odpowiedzialna za wygenerowanie fiszek na podstawie dostarczonego tekstu i języka.

**Logika działania:**

1. Walidacja parametrów wejściowych (`inputText`, `language`).
2. Zbudowanie komunikatu systemowego (`system prompt`) instruującego model co do jego roli i oczekiwanego formatu odpowiedzi.
3. Zbudowanie komunikatu użytkownika (`user prompt`) zawierającego tekst do przetworzenia.
4. Zdefiniowanie schematu JSON dla odpowiedzi za pomocą `response_format`.
5. Wybór odpowiedniego modelu LLM na podstawie języka lub innych kryteriów.
6. Złożenie pełnego zapytania (request payload) do punktu końcowego `/chat/completions`.
7. Wysłanie zapytania do API OpenRouter.
8. Deserializacja odpowiedzi JSON do obiektów DTO.
9. Zmapowanie wyników i zwrócenie listy `FlashcardCandidateDto`.

## 4. Prywatne Metody i Pola

### Pola

- `_httpClient`: Instancja klienta HTTP.
- `_logger`: Instancja loggera.
- `_apiKey`: Klucz API do autoryzacji.

### Metody

#### `string BuildSystemPrompt(string language)`

Tworzy komunikat systemowy w odpowiednim języku, instruujący model, aby działał jako ekspert w tworzeniu fiszek.

#### `string BuildUserPrompt(string inputText)`

Tworzy komunikat użytkownika, zawierający tekst źródłowy do analizy.

#### `object CreateFlashcardGenerationPayload(string systemPrompt, string userPrompt, string modelName)`

Tworzy anonimowy obiekt lub dedykowaną klasę DTO reprezentującą ciało zapytania (payload) do API OpenRouter. To tutaj definiowany jest `response_format` ze schematem JSON.

**Przykład implementacji `response_format`:**

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
            strict = true, // Wymusza ścisłe przestrzeganie schematu
            schema = schema
        }
    },
    temperature = 0.7
};
```

## 5. Obsługa Błędów

Należy zaimplementować robustną obsługę błędów, która obejmuje zarówno problemy z komunikacją sieciową, jak i błędy zwracane przez API OpenRouter.

1.  **Błędy sieciowe i timeout (`HttpRequestException`, `TaskCanceledException`):**

    - Logować błąd.
    - Rzucać dedykowany wyjątek `AIServiceUnavailableException` z informacją, że usługa AI jest niedostępna.

2.  **Błędy API OpenRouter (statusy `4xx`, `5xx`):**

    - Odczytać treść odpowiedzi błędu z API, która często zawiera użyteczne informacje diagnostyczne.
    - Logować status code i treść błędu.
    - Dla statusu `401 Unauthorized`: Rzucać `AIServiceConfigurationException` z informacją o prawdopodobnie nieprawidłowym kluczu API.
    - Dla statusu `429 Too Many Requests`: Implementować mechanizm ponawiania prób (retry) z opóźnieniem (exponential backoff).
    - Dla innych błędów: Rzucać `AIServiceUnavailableException` z komunikatem błędu z API.

3.  **Błędy parsowania JSON (`JsonException`):**
    - Mimo użycia `response_format`, należy być przygotowanym na ewentualne problemy z deserializacją.
    - Logować błąd i surową odpowiedź z API.
    - Rzucać `AIServiceUnavailableException` z informacją o nieprawidłowym formacie odpowiedzi.

## 6. Kwestie Bezpieczeństwa

1.  **Zarządzanie kluczem API:**

    - Klucz API (`OpenRouter:ApiKey`) **musi** być przechowywany w bezpiecznym miejscu. W środowisku deweloperskim można użyć `secrets.json`, a w produkcyjnym – Azure Key Vault lub innego bezpiecznego magazynu sekretów.
    - **Nigdy** nie umieszczaj klucza API bezpośrednio w kodzie źródłowym ani w plikach `appsettings.json` wersjonowanych w repozytorium.

2.  **Walidacja danych wejściowych:**

    - Przed wysłaniem danych do API, należy je zwalidować, aby zapobiec atakom typu "prompt injection". Chociaż jest to trudne, podstawowa sanitazyacja (np. ograniczenie długości tekstu) jest zalecana.

3.  **Logowanie:**
    - Należy uważać, aby nie logować pełnych danych wejściowych od użytkowników, jeśli mogą one zawierać informacje wrażliwe. Loguj metadane (np. długość tekstu), a nie samą treść.

## 7. Plan Wdrożenia Krok po Kroku

1.  **Konfiguracja projektu:**
    a. Dodaj wpisy do `appsettings.Development.json` dla konfiguracji OpenRouter:
    `json
    "OpenRouter": {
      "ApiKey": "twoj_klucz_api_z_user_secrets",
      "Referer": "http://localhost:5000" // lub adres twojej aplikacji
    }
    `
    b. Dodaj klucz API do menedżera sekretów dla projektu `10xdevs.Api`:
    `bash
    dotnet user-secrets set "OpenRouter:ApiKey" "sk-or-v1-..."
    `

2.  **Utworzenie nowej usługi:**
    a. W projekcie `10xdevs.Infrastructure` utwórz nowy plik `Services/OpenRouterService.cs`.
    b. Zaimplementuj klasę `OpenRouterService` zgodnie z opisem z sekcji 2, 3 i 4 tego przewodnika.
    c. Utwórz prywatne klasy DTO do serializacji zapytania i deserializacji odpowiedzi, aby uniknąć używania typów anonimowych w finalnym kodzie.

3.  **Rejestracja usługi w kontenerze DI:**
    a. W projekcie `10xdevs.Api`, w pliku `Program.cs` (lub w odpowiedniej metodzie rozszerzającej `IServiceCollection`), zmień rejestrację `IFlashcardAIService`:
    ```csharp
    // Usuń lub zakomentuj starą rejestrację
    // services.AddScoped<IFlashcardAIService, FlashcardAIService>();

        // Dodaj nową rejestrację
        services.AddScoped<IFlashcardAIService, OpenRouterService>();
        ```

4.  **Implementacja logiki generowania fiszek:**
    a. W `OpenRouterService.GenerateFlashcardsAsync` zaimplementuj pełną logikę opisaną w sekcji 3.
    b. Zwróć szczególną uwagę na poprawną konstrukcję obiektu `response_format`, ponieważ jest to klucz do uzyskania niezawodnych, ustrukturyzowanych odpowiedzi i uniknięcia skomplikowanego parsowania, które było problemem w `FlashcardAIService`.
    c. Wybierz model, np. `mistralai/mistral-7b-instruct` jako domyślny, który dobrze radzi sobie z instrukcjami i formatem JSON.

5.  **Obsługa błędów i logowanie:**
    a. Zaimplementuj blok `try-catch` obejmujący wywołanie `_httpClient.PostAsync`.
    b. Obsłuż wyjątki `HttpRequestException`, `TaskCanceledException` i `JsonException` zgodnie z opisem w sekcji 5.
    c. Dodaj logowanie na kluczowych etapach: przed wysłaniem zapytania, po otrzymaniu odpowiedzi oraz w przypadku każdego błędu.

6.  **Testowanie:**
    a. Uruchom aplikację i przetestuj funkcjonalność generowania fiszek z poziomu interfejsu użytkownika lub za pomocą Swaggera.
    b. Sprawdź logi, aby upewnić się, że komunikacja z API przebiega poprawnie.
    c. Przetestuj scenariusze błędów, np. podając nieprawidłowy klucz API, aby zweryfikować, czy wyjątki są poprawnie obsługiwane.

7.  **Finalizacja i Czyszczenie Artefaktów po Ollama:**
    Po pomyślnym wdrożeniu i przetestowaniu `OpenRouterService`, kluczowe jest usunięcie wszystkich pozostałości po poprzedniej implementacji, aby zapewnić czystość i spójność projektu.

    a. **Usunięcie usługi:**

    - Usuń plik `backend/src/10xdevs.Infrastructure/Services/FlashcardAIService.cs`.

    b. **Aktualizacja konfiguracji:**

    - W pliku `appsettings.json` oraz `appsettings.Development.json` usuń całą sekcję `Ollama`.
    - W menedżerze sekretów (`secrets.json`) usuń ewentualne wpisy związane z Ollama.

    c. **Aktualizacja rejestracji zależności (DI):**

    - W pliku `backend/src/10xdevs.Infrastructure/Extensions/ServiceCollectionExtensions.cs` upewnij się, że cała sekcja `services.AddHttpClient<IFlashcardAIService, FlashcardAIService>(...)` została usunięta i zastąpiona nową konfiguracją dla `OpenRouterService`.

    d. **Aktualizacja kodu źródłowego:**

    - **Wyjątki:** Zmodyfikuj komentarz w `backend/src/10xdevs.Application/Exceptions/AIServiceUnavailableException.cs`, aby odnosił się ogólnie do "usługi AI", a nie konkretnie do Ollama.
      ```csharp
      // Przed: Exception thrown when the AI service (Ollama) is unavailable...
      // Po:   Exception thrown when the AI service is unavailable...
      ```
    - **Kontrolery:** Przejrzyj komentarze i logi w `backend/src/10xdevs.Api/Controllers/FlashcardsController.cs` i usuń wszelkie odniesienia do starej implementacji.

    e. **Aktualizacja dokumentacji:**

    - **Główny `README.md`:** W głównym katalogu projektu zaktualizuj tabelę `Tech Stack` oraz sekcję `Getting Started Locally`, usuwając Ollama i instrukcje dotyczące jego instalacji.
    - **Backend `README.md`:** W pliku `backend/README.md` zaktualizuj `Technology Stack`, `Prerequisites` oraz sekcję `Ollama Setup`, zastępując je informacjami o OpenRouter.
    - **Dokumentacja `tech-stack`:** Zaktualizuj pliki `docs/tech-stack.en.md` i `docs/tech-stack.pl.md`, zastępując w sekcji "Artificial Intelligence (AI)" informacje o Ollama nowymi, dotyczącymi OpenRouter.
