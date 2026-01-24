# Architektura UI dla AI Flashcard Generator

## 1. Przegląd Struktury UI

Architektura UI została zaprojektowana w sposób zorientowany na funkcje, modułowy i skalowalny, z wykorzystaniem Vue 3 z Composition API, TypeScript oraz Vuetify jako biblioteki komponentów. Struktura jest skoncentrowana na przejrzystych przepływach użytkownika, od uwierzytelniania, przez generowanie fiszek, ich recenzję, zarządzanie, aż po naukę.

Zarządzanie stanem będzie obsługiwane przez Pinia, z dedykowanymi modułami (stores) dla różnych domen (`auth`, `flashcards`, `generation`, `learning`, `ui`). Zapewnia to wyraźne rozdzielenie odpowiedzialności i scentralizowaną logikę biznesową. Komunikacja z API jest wyabstrahowana do dedykowanej warstwy `api/`, a interceptory Axios zarządzają globalnymi aspektami, takimi jak wstrzykiwanie JWT i stan ładowania.

Doświadczenie użytkownika jest priorytetem dzięki responsywnemu projektowi, globalnej nakładce ładowania dla wszystkich żądań API, spójnemu systemowi powiadomień dla informacji zwrotnej oraz walidacji po stronie klienta w celu zapewnienia natychmiastowych odpowiedzi.

## 2. Lista Widoków

### 2.1. Widok Logowania

- **Nazwa Widoku**: `LoginView.vue`
- **Ścieżka Widoku**: `/login`
- **Główny Cel**: Umożliwienie zarejestrowanym użytkownikom uwierzytelnienia i dostępu do aplikacji.
- **Kluczowe Informacje do Wyświetlenia**: Pola do wpisania nazwy użytkownika i hasła, przycisk logowania, link do widoku rejestracji.
- **Kluczowe Komponenty Widoku**: `BaseInput` dla poświadczeń, `BaseButton` do przesłania formularza.
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Jasne komunikaty o błędach w przypadku nieprawidłowych poświadczeń lub błędów serwera. Automatyczne ustawienie fokusu na polu nazwy użytkownika.
  - **Dostępność**: Odpowiednie etykiety dla pól wejściowych, wsparcie dla nawigacji klawiaturą.
  - **Bezpieczeństwo**: Pole hasła powinno być typu `password`. Komunikacja z API musi odbywać się przez HTTPS.

### 2.2. Widok Rejestracji

- **Nazwa Widoku**: `RegisterView.vue`
- **Ścieżka Widoku**: `/register`
- **Główny Cel**: Umożliwienie nowym użytkownikom utworzenia konta.
- **Kluczowe Informacje do Wyświetlenia**: Pola do wpisania nazwy użytkownika i hasła, przycisk rejestracji, link do widoku logowania.
- **Kluczowe Komponenty Widoku**: `BaseInput` dla poświadczeń, `BaseButton` do przesłania formularza.
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Walidacja w czasie rzeczywistym dostępności nazwy użytkownika i siły hasła. Jasne powiadomienia o sukcesie/błędzie.
  - **Dostępność**: Atrybuty ARIA dla informacji zwrotnej z walidacji.
  - **Bezpieczeństwo**: Wymuszenie minimalnej długości hasła. Zapobieganie enumeracji nazw użytkowników poprzez ogólny komunikat "Nazwa użytkownika już istnieje".

### 2.3. Widok Panelu Głównego (Dashboard)

- **Nazwa Widoku**: `DashboardView.vue`
- **Ścieżka Widoku**: `/` (Strona główna)
- **Główny Cel**: Służenie jako centralny punkt dla użytkownika po zalogowaniu, zapewniający szybki dostęp do podstawowych funkcjonalności.
- **Kluczowe Informacje do Wyświetlenia**: Wiadomość powitalna, podsumowanie liczby fiszek do powtórki, główne przyciski akcji.
- **Kluczowe Komponenty Widoku**: `BaseCard` do wyświetlania statystyk, `BaseButton` do nawigacji ("Rozpocznij naukę", "Generuj fiszki", "Moje fiszki").
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Przejrzysta i zwięzła prezentacja kluczowych akcji. Wyłączony przycisk "Rozpocznij naukę", jeśli nie ma kart do powtórki.
  - **Dostępność**: Przyciski powinny mieć jasne, opisowe etykiety.
  - **Bezpieczeństwo**: Ta trasa musi być chroniona i dostępna tylko dla uwierzytelnionych użytkowników.

### 2.4. Widok Generowania Fiszek

- **Nazwa Widoku**: `GenerateView.vue`
- **Ścieżka Widoku**: `/generate`
- **Główny Cel**: Umożliwienie użytkownikom wprowadzania tekstu w celu generowania fiszek przez AI.
- **Kluczowe Informacje do Wyświetlenia**: Duże pole tekstowe na dane wejściowe oraz przycisk "Generuj".
- **Kluczowe Komponenty Widoku**: `BaseInput` (textarea), `BaseButton`.
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Licznik znaków dla pola tekstowego. Globalna nakładka ładowania wyświetlana podczas generowania.
  - **Dostępność**: Pole tekstowe powinno mieć odpowiednią etykietę.
  - **Bezpieczeństwo**: Ta trasa musi być chroniona. Walidacja po stronie klienta w celu egzekwowania limitu znaków przed wysłaniem do API.

### 2.5. Widok Recenzji Fiszek

- **Nazwa Widoku**: `ReviewView.vue`
- **Ścieżka Widoku**: `/review/:eventId`
- **Główny Cel**: Umożliwienie użytkownikom przeglądania, edytowania, akceptowania lub odrzucania kandydatów na fiszki wygenerowanych przez AI.
- **Kluczowe Informacje do Wyświetlenia**: Lista kandydatów na fiszki, każdy z pytaniem i odpowiedzią. Kontrolki dla każdego kandydata (Akceptuj, Edytuj, Odrzuć). Przycisk "Zakończ recenzję".
- **Kluczowe Komponenty Widoku**: `BaseCard` dla każdego kandydata, `BaseButton` do akcji, `EditFlashcardModal` do edycji.
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Wizualne rozróżnienie statusu każdej karty (np. zielona ramka dla zaakceptowanej, żółta dla edytowanej). Stan jest efemeryczny i zarządzany w module `generation` do momentu finalizacji.
  - **Dostępność**: Przyjazne dla klawiatury kontrolki do zarządzania kandydatami.
  - **Bezpieczeństwo**: Ta trasa musi być chroniona. Użytkownik może uzyskać dostęp tylko do zdarzeń, które sam zainicjował.

### 2.6. Widok Listy Fiszek

- **Nazwa Widoku**: `FlashcardsView.vue`
- **Ścieżka Widoku**: `/flashcards`
- **Główny Cel**: Wyświetlanie wszystkich zapisanych fiszek użytkownika i umożliwienie zarządzania nimi.
- **Kluczowe Informacje do Wyświetlenia**: Lista wszystkich fiszek użytkownika.
- **Kluczowe Komponenty Widoku**: `BaseCard` dla każdej fiszki, `BaseButton` do "Dodaj nową" i akcji (Edytuj, Usuń), `EditFlashcardModal`, `BaseConfirmModal` do usuwania.
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Komponent `EmptyState` jest pokazywany, jeśli użytkownik nie ma żadnych fiszek. Wymagane jest potwierdzenie usunięcia.
  - **Dostępność**: Lista powinna być nawigowalna, a wszystkie akcje jasno oznaczone.
  - **Bezpieczeństwo**: Ta trasa musi być chroniona.

### 2.7. Widok Sesji Nauki

- **Nazwa Widoku**: `LearningSessionView.vue`
- **Ścieżka Widoku**: `/learn`
- **Główny Cel**: Przeprowadzenie użytkownika przez sesję nauki z wykorzystaniem powtórek interwałowych.
- **Kluczowe Informacje do Wyświetlenia**: Pytanie bieżącej fiszki, przycisk "Pokaż odpowiedź", odpowiedź (po odkryciu) oraz kontrolki oceny (0-5).
- **Kluczowe Komponenty Widoku**: `BaseCard` do wyświetlania fiszki, `BaseButton` do pokazywania odpowiedzi, siatka przycisków oceny.
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Płynne przejście/animacja podczas odkrywania odpowiedzi. Po ocenie automatycznie ładowana jest następna karta. Widok `EmptyState` jest pokazywany, jeśli nie ma kart do powtórki.
  - **Dostępność**: Cały przepływ powinien być możliwy do obsłużenia za pomocą klawiatury.
  - **Bezpieczeństwo**: Ta trasa musi być chroniona.

### 2.8. Widok Podsumowania Nauki

- **Nazwa Widoku**: `LearningSummaryView.vue`
- **Ścieżka Widoku**: `/learn/summary`
- **Główny Cel**: Wyświetlenie podsumowania zakończonej sesji nauki.
- **Kluczowe Informacje do Wyświetlenia**: Liczba przejrzanych fiszek, statystyki wydajności oraz przycisk powrotu do panelu głównego.
- **Kluczowe Komponenty Widoku**: `BaseCard` dla statystyk, `BaseButton` do nawigacji.
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Jasne, motywujące podsumowanie zachęcające do przyszłej nauki.
  - **Dostępność**: Wszystkie dane powinny być przedstawione w czytelnym formacie.
  - **Bezpieczeństwo**: Ta trasa musi być chroniona.

### 2.9. Widok Statystyk

- **Nazwa Widoku**: `StatisticsView.vue`
- **Ścieżka Widoku**: `/statistics`
- **Główny Cel**: Wyświetlanie globalnych statystyk dotyczących jakości generowania fiszek przez AI.
- **Kluczowe Informacje do Wyświetlenia**: Całkowita liczba kandydatów, wskaźnik akceptacji, wskaźnik czystej akceptacji oraz informacja, czy metryka sukcesu jest spełniona.
- **Kluczowe Komponenty Widoku**: `BaseCard` do wyświetlania metryk.
- **UX, Dostępność i Bezpieczeństwo**:
  - **UX**: Prosta, łatwa do zrozumienia wizualizacja danych.
  - **Dostępność**: Dane powinny być jasno oznaczone.
  - **Bezpieczeństwo**: Ta trasa musi być chroniona.

## 3. Mapa Podróży Użytkownika

Główna podróż użytkownika obejmuje generowanie fiszek z tekstu, a następnie ich naukę.

1.  **Uwierzytelnianie**:

    - Nowy użytkownik zaczyna w `RegisterView` (`/register`), tworzy konto i jest przekierowywany do `DashboardView` (`/`).
    - Powracający użytkownik zaczyna w `LoginView` (`/login`), loguje się i jest przekierowywany do `DashboardView` (`/`).

2.  **Główny Przypadek Użycia: Generowanie i Nauka**:
    - **Krok 1**: Z `DashboardView` (`/`), użytkownik klika "Generuj fiszki" i przechodzi do `GenerateView` (`/generate`).
    - **Krok 2**: W `GenerateView`, użytkownik wkleja tekst, wybiera język i klika "Generuj". Pojawia się globalna nakładka ładowania.
    - **Krok 3**: Po pomyślnym wygenerowaniu, użytkownik jest przekierowywany do `ReviewView` (`/review/:eventId`).
    - **Krok 4**: W `ReviewView`, użytkownik przegląda każdego kandydata, wybierając `Akceptuj`, `Odrzuć` lub `Edytuj` (co otwiera `EditFlashcardModal`).
    - **Krok 5**: Po przejrzeniu, użytkownik klika "Zakończ recenzję". Zaakceptowane/edytowane fiszki są zapisywane, a użytkownik jest przekierowywany do `FlashcardsView` (`/flashcards`) lub `DashboardView` (`/`).
    - **Krok 6**: Z `DashboardView` (`/`), użytkownik klika "Rozpocznij naukę" i przechodzi do `LearningSessionView` (`/learn`).
    - **Krok 7**: W `LearningSessionView`, użytkownik widzi pytanie, odkrywa odpowiedź i ocenia swoją pamięć (0-5). Proces ten powtarza się dla wszystkich kart do powtórki.
    - **Krok 8**: Po sesji, użytkownik jest przekierowywany do `LearningSummaryView` (`/learn/summary`), aby zobaczyć swoje wyniki.
    - **Krok 9**: Z podsumowania, użytkownik wraca do `DashboardView` (`/`).

## 4. Układ i Struktura Nawigacji

- **Główny Układ**: Domyślny układ (`DefaultLayout.vue`) będzie zawierał stały pasek nawigacyjny i główny obszar treści, w którym renderowany jest widok routera.
- **Pasek Nawigacyjny**: Górny pasek nawigacyjny będzie zawierał:
  - Logo/nazwę aplikacji.
  - Linki nawigacyjne: "Panel główny", "Moje fiszki", "Generuj", "Statystyki".
  - Komponent `LanguageSwitcher`.
  - Przycisk "Wyloguj".
- **Układ Uwierzytelniania**: Osobny, prostszy układ (`AuthLayout.vue`) będzie używany dla `LoginView` i `RegisterView`, zawierający tylko formularz i brak głównej nawigacji.
- **Routing**: Vue Router będzie zarządzał nawigacją. Trasy wymagające uwierzytelnienia będą chronione przez globalny `beforeEach` guard, który sprawdza ważność tokenu JWT w module `auth`.

## 5. Kluczowe Komponenty

- **`BaseButton.vue`**: Opakowanie (wrapper) na komponent przycisku Vuetify, aby zapewnić spójny styl i właściwości w całej aplikacji.
- **`BaseInput.vue`**: Opakowanie dla pól tekstowych i obszarów tekstowych Vuetify, wstępnie skonfigurowane ze standardowymi regułami walidacji i stylami.
- **`BaseCard.vue`**: Opakowanie dla komponentu karty Vuetify, używane do wyświetlania fiszek, statystyk i innej zawartości w kontenerach.
- **`BaseModal.vue`**: Generyczny komponent modalny do hostowania formularzy, takich jak edycja fiszek.
- **`BaseConfirmModal.vue`**: Specjalistyczny modal do potwierdzania destrukcyjnych akcji, takich jak usuwanie fiszki.
- **`LanguageSwitcher.vue`**: Komponent do przełączania języka aplikacji (PL/EN).
- **`EmptyState.vue`**: Komponent wielokrotnego użytku do wyświetlania, gdy lista jest pusta (np. brak fiszek, brak kart do powtórki).
