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

- **Rozwiązanie:** Ollama do hostowania modeli open-source (LLM).
- **Uzasadnienie:**
  - Bezpłatne (poza infrastrukturą).
  - Prywatność danych.
  - Pełna kontrola nad modelem.
- **Sposób działania:** Lokalne API do wysyłania zapytań (promptów) z żądaniem odpowiedzi w formacie JSON.
- **Przykładowe modele:** Llama 3, Mistral, Phi-3.

## Testowanie

### Frontend

- **Testy jednostkowe i komponentowe:** Vitest
- **Testy End-to-End (E2E):** Cypress
