# Specyfikacja Techniczna

## Frontend

- **Framework:** Vue 3 (z Composition API)
- **Język:** TypeScript
- **Biblioteka UI:** Vuetify
- **Zarządzanie stanem:** Pinia
- **Routing:** Vue Router
- **Stylowanie:** SCSS oraz klasy Vuetify
- **Narzędzia:** ESLint i Prettier

## Backend

- **Platforma:** .NET
- **Dostęp do danych (ORM):** Entity Framework
- **Wzorzec architektoniczny:** CQRS (Command Query Responsibility Segregation)
- **Dokumentacja API:** Swagger (OpenAPI)

## Baza Danych

- **System:** SQL Server

## Sztuczna Inteligencja (AI)

- **Rozwiązanie:** OpenRouter - API chmurowe do dostępu do różnych modeli LLM.
- **Uzasadnienie:**
  - Dostęp do wielu najnowszych modeli.
  - Brak wymagań infrastruktury lokalnej.
  - Model płatności za użycie.
  - Niezawodna dostępność i wydajność.
- **Sposób działania:** REST API do wysyłania zapytań (promptów) ze strukturalnym formatem odpowiedzi JSON przy użyciu JSON Schema.
- **Domyślny model:** Mistral 7B Instruct (opłacalny i niezawodny w podążaniu za instrukcjami).

## Testowanie

### Frontend

- **Testy jednostkowe i komponentowe:** Vitest
- **Testy End-to-End (E2E):** Cypress

### Backend

- **Testy jednostkowe:** xUnit
- **Biblioteka asercji:** FluentAssertions
- **Biblioteka mockująca:** NSubstitute
