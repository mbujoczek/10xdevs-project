# Plan Testów Aplikacji

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje kompleksowy plan testów dla aplikacji AI Flashcard Generator, platformy do nauki z wykorzystaniem inteligentnych fiszek (flashcards). Plan obejmuje strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie najwyższej jakości produktu końcowego. Projekt składa się z aplikacji frontendowej w Vue.js, backendu w technologii .NET z architekturą CQRS oraz bazy danych SQL Server.

### 1.2. Cele Testowania

Głównym celem procesu testowania jest weryfikacja, czy aplikacja spełnia wymagania funkcjonalne i niefunkcjonalne, a także zapewnienie jej stabilności, bezpieczeństwa i użyteczności.

**Cele szczegółowe:**

- Zapewnienie poprawności działania kluczowych funkcjonalności (rejestracja, logowanie, generowanie fiszek, proces nauki).
- Weryfikacja spójności i integralności danych w systemie.
- Zapewnienie wysokiej wydajności i responsywności aplikacji pod obciążeniem.
- Identyfikacja i eliminacja luk bezpieczeństwa.
- Zapewnienie intuicyjności i wysokiej jakości doświadczenia użytkownika (UX).
- Weryfikacja poprawnej integracji pomiędzy frontendem, backendem a usługą AI (OpenRouter).

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami:

- **Moduł uwierzytelniania:** Rejestracja, logowanie, zarządzanie sesją.
- **Moduł zarządzania fiszkami:**
  - Ręczne tworzenie, edycja i usuwanie fiszek.
  - Automatyczne generowanie fiszek z tekstu z wykorzystaniem AI.
  - Przeglądanie listy fiszek.
- **Moduł nauki:**
  - Rozpoczynanie i kończenie sesji nauki.
  - Wyświetlanie fiszek do powtórki (algorytm SRS).
  - Ocenianie odpowiedzi (łatwa, dobra, trudna).
- **Moduł statystyk:** Prezentacja postępów w nauce i wskaźników efektywności.
- **Integracja z AI:** Poprawność komunikacji z OpenRouter, obsługa odpowiedzi i błędów.

### 2.2. Funkcjonalności wyłączone z testów:

- Testy samego modelu AI (np. Mistral 7B) pod kątem jakości generowanych treści (zakładamy poprawność działania usługi zewnętrznej).
- Testy infrastruktury serwerowej (poza konfiguracją w kontenerach Docker).

## 3. Typy Testów

Proces testowy zostanie podzielony na następujące poziomy i typy:

| Poziom        | Typ Testu                                   | Opis                                                                                                                                              | Technologie                          | Odpowiedzialność                             |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------- |
| **Frontend**  | **Testy Jednostkowe (Unit Tests)**          | Testowanie pojedynczych komponentów Vue, funkcji composables i logiki w sklepach Pinia w izolacji.                                                | Vitest                               | Deweloperzy Frontend                         |
|               | **Testy Komponentowe (Component Tests)**    | Testowanie interakcji w obrębie bardziej złożonych komponentów lub grup komponentów.                                                              | Vitest                               | Deweloperzy Frontend                         |
|               | **Testy End-to-End (E2E)**                  | Symulacja rzeczywistych scenariuszy użytkownika w przeglądarce, weryfikacja kompletnych przepływów (np. od logowania do zakończenia sesji nauki). | Cypress                              | Inżynier QA / Deweloperzy                    |
| **Backend**   | **Testy Jednostkowe (Unit Tests)**          | Testowanie pojedynczych klas, metod, handlerów CQRS i logiki domenowej w izolacji od zależności (np. bazy danych).                                | xUnit, NSubstitute, FluentAssertions | Deweloperzy Backend                          |
|               | **Testy Integracyjne (Integration Tests)**  | Weryfikacja współpracy pomiędzy warstwami aplikacji (API, Application, Infrastructure), w tym interakcji z bazą danych w kontenerze testowym.     | xUnit, Testcontainers                | Deweloperzy Backend                          |
| **Systemowe** | **Testy API (API Tests)**                   | Testowanie publicznego API (endpointów) pod kątem poprawności kontraktów, obsługi żądań, odpowiedzi i kodów statusu.                              | Postman, Insomnia                    | Inżynier QA / Deweloperzy Backend            |
|               | **Testy Wydajnościowe (Performance Tests)** | Badanie zachowania systemu pod obciążeniem, mierzenie czasów odpowiedzi i zużycia zasobów.                                                        | JMeter, k6                           | Inżynier QA                                  |
|               | **Testy Bezpieczeństwa (Security Tests)**   | Identyfikacja potencjalnych podatności (np. SQL Injection, XSS, problemy z autoryzacją).                                                          | OWASP ZAP                            | Inżynier QA / Specjalista ds. Bezpieczeństwa |
|               | **Testy Użyteczności (Usability Tests)**    | Ocena interfejsu użytkownika pod kątem intuicyjności, przejrzystości i ogólnego doświadczenia.                                                    | Analiza manualna                     | Inżynier QA / UX Designer                    |

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Rejestracja i Logowanie

- **TC1:** Pomyślna rejestracja nowego użytkownika z poprawnymi danymi.
- **TC2:** Próba rejestracji z zajętą nazwą użytkownika.
- **TC3:** Pomyślne logowanie z poprawnymi danymi.
- **TC4:** Próba logowania z błędnym hasłem.
- **TC5:** Walidacja pól formularzy (np. wymagane pola).

### 4.2. Generowanie Fiszek z Tekstu (AI)

- **TC6:** Pomyślne wygenerowanie fiszek po wprowadzeniu poprawnego tekstu.
- **TC7:** Weryfikacja, czy wygenerowane fiszki mają poprawną strukturę (pytanie/odpowiedź).
- **TC8:** Obsługa błędu po stronie API OpenRouter (np. przekroczenie limitu, błąd serwera).
- **TC9:** Weryfikacja zachowania aplikacji przy próbie generowania fiszek z pustego tekstu.

### 4.3. Sesja Nauki

- **TC10:** Rozpoczęcie sesji nauki i poprawne wyświetlenie pierwszej fiszki.
- **TC11:** Ocenienie fiszki i weryfikacja, czy data następnej powtórki została poprawnie obliczona.
- **TC12:** Zakończenie sesji po przejrzeniu wszystkich zaplanowanych fiszek.

## 5. Środowisko Testowe

- **Środowisko deweloperskie (lokalne):** Uruchamiane lokalnie na maszynach deweloperów z wykorzystaniem `docker-compose`. Służy do testów jednostkowych i integracyjnych.
- **Środowisko testowe (staging):** Osobna, dedykowana instancja aplikacji wdrożona w środowisku zbliżonym do produkcyjnego. Na tym środowisku będą przeprowadzane testy E2E, API, wydajnościowe i UAT (User Acceptance Testing).
- **Baza danych:** Dla testów integracyjnych i E2E będzie wykorzystywana dedykowana baza danych SQL Server, uruchamiana w kontenerze Docker, z danymi resetowanymi przed każdym cyklem testowym.

## 6. Narzędzia do Testowania

| Narzędzie              | Zastosowanie                                                   |
| ---------------------- | -------------------------------------------------------------- |
| **Vitest**             | Testy jednostkowe i komponentowe dla frontendu (Vue.js).       |
| **Cypress**            | Testy End-to-End (E2E) dla frontendu.                          |
| **xUnit**              | Testy jednostkowe dla backendu (.NET).                         |
| **NSubstitute**        | Biblioteka do mockowania zależności w testach backendu.        |
| **FluentAssertions**   | Biblioteka do tworzenia czytelnych asercji w testach backendu. |
| **Postman / Insomnia** | Ręczne i automatyczne testy API.                               |
| **JMeter / k6**        | Testy wydajnościowe i obciążeniowe API.                        |
| **OWASP ZAP**          | Skanowanie w poszukiwaniu podstawowych luk bezpieczeństwa.     |
| **GitHub**             | System do zarządzania testami i raportowania błędów.           |
