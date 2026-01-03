<conversation_summary>

<decisions>

1. **Pulpit Główny (`DashboardView.vue`)**: Będzie agregował dane z różnych endpointów, zawierał przyciski do rozpoczęcia nauki, generowania fiszek i przejścia do listy fiszek.
2. **Proces Recenzji Fiszki**: Stan kandydatów na fiszki będzie zarządzany w dedykowanym module Pinia (generation.store.ts). Sesja recenzji jest trzymana w store i resetowana po zakończeniu lub odrzuceniu. Interfejs będzie wizualnie odróżniał statusy fiszek (zaakceptowana, edytowana, odrzucona) za pomocą ramek/ikon i wyłączał nieodpowiednie akcje.
3. **Edycja Fiszki**: Będzie odbywać się w oknie modalnym EditFlashcardModal.vue wywoływanym z listy fiszek.
4. **Powiadomienia i Błędy**: Globalny system powiadomień (toasts) zostanie zaimplementowany jako composable (useNotifications) z użyciem biblioteki open-source.
5. **Zmiana Języka**: Opcja zmiany języka (PL/EN, domyślnie EN) będzie zaimplementowana jako komponent LanguageSwitcher.vue w prawym górnym rogu, używając localStorage i vue-i18n.
6. **Sesja Nauki**: Widok LearningSessionView.vue będzie pokazywał pytanie, a następnie odpowiedź z animacją. Oceny (0-5) będą wysyłały żądanie do API i ładowały kolejną fiszkę. Po zakończeniu sesji nastąpi przekierowanie do widoku podsumowania (LearningSummaryView.vue) ze statystykami.
7. **Routing i Autoryzacja**: Zostanie zaimplementowany globalny beforeEach guard w router/index.ts do ochrony tras. Wygaśnięcie tokenu JWT spowoduje automatyczne wylogowanie i przekierowanie do strony logowania.
8. **Komponenty Bazowe**: Zostaną stworzone komponenty BaseButton.vue, BaseCard.vue, BaseInput.vue, BaseModal.vue jako opakowania na komponenty Vuetify.
9. **Zarządzanie Stanem (Pinia)**: Zostaną utworzone moduły: auth.store.ts, flashcards.store.ts, learning.store.ts, generation.store.ts, ui.store.ts.
10. **Widok Statystyk**: Prosty widok StatisticsView.vue będzie prezentował globalne wskaźniki procentowe dotyczące jakości generowania fiszek.
11. **Lista Fiszek**: W MVP nie będzie paginacji; wszystkie fiszki użytkownika będą wyświetlane na jednej liście.
12. **Globalny Stan Ładowania**: Każde zapytanie do API będzie aktywowało globalną, blokującą maskę ładowania (v-overlay z Vuetify) zarządzaną przez ui.store.ts i interceptory axios.
13. **Usuwanie Fiszki**: Proces będzie wymagał potwierdzenia w modalnym oknie dialogowym (BaseConfirmModal.vue).
14. **Responsywność**: Kluczowe widoki będą responsywne, z wykorzystaniem grid systemu Vuetify.
15. **Walidacja Formularzy**: Walidacja po stronie klienta zostanie zaimplementowana przy użyciu wbudowanych w Vuetify atrybutów rules w komponentach BaseInput.vue.
16. **Struktura Logiki Biznesowej**: Warstwa services zostaje usunięta. Logika biznesowa będzie umieszczona bezpośrednio w modułach Pinia (store), które będą komunikować się z warstwą api.

</decisions>

<matched_recommendations>

- **Globalna Maska Ładowania**: Zamiast indywidualnych szkieletów ładowania, każde wywołanie API aktywuje globalną, blokującą maskę (v-overlay), zarządzaną przez dedykowany ui.store.ts i interceptory axios.
- **Struktura Tras**: Zostanie zaimplementowana zagnieżdżona struktura tras z leniwym ładowaniem (lazy loading) dla poszczególnych widoków w celu optymalizacji wydajności.
- **Obsługa Stanów Pustych i Błędów**: Aplikacja będzie używać dedykowanych komponentów (EmptyState.vue) do obsługi sytuacji, gdy brakuje danych (np. brak fiszek do nauki), oraz spójnego systemu powiadomień (toast) do informowania o błędach i sukcesach.
- **Walidacja po Stronie Klienta**: Formularze będą wykorzystywać wbudowane w Vuetify mechanizmy walidacji (rules) w celu zapewnienia natychmiastowej informacji zwrotnej dla użytkownika i zmniejszenia liczby zapytań do serwera.
- **Architektura Logiki**: Logika biznesowa zostanie skonsolidowana w modułach Pinia, eliminując potrzebę dodatkowej warstwy services. Moduły store będą orkiestrować wywołania do warstwy api.
- **Komponenty Bazowe i Spójność UI**: Zostaną stworzone opakowujące komponenty bazowe (BaseButton, BaseInput etc.) oraz zdefiniowany zestaw ikon (mdi-pencil, mdi-delete etc.), aby zapewnić spójność wizualną i funkcjonalną w całej aplikacji.
- **Zarządzanie Sesją Użytkownika**: Stan uwierzytelnienia, dane użytkownika i token JWT będą zarządzane w auth.store.ts. Ochrona tras i automatyczne wylogowanie po wygaśnięciu tokenu zapewnią bezpieczeństwo.
- **Responsywność**: Interfejs będzie w pełni responsywny, z układami dostosowującymi się do różnych rozmiarów ekranu (np. przyciski w kolumnie na mobile, siatka ocen 2x3) przy użyciu grid systemu Vuetify.

</matched_recommendations>

<ui_architecture_planning_summary>

Na podstawie przeprowadzonych dyskusji, architektura UI dla MVP aplikacji AI Flashcard Generator zostanie oparta na frameworku Vue 3 z Vuetify i TypeScript. Architektura będzie zorientowana na funkcje (`features`), co zapewni skalowalność i modularność.

**Kluczowe Widoki i Przepływy Użytkownika**:

**Uwierzytelnianie**: Osobne widoki dla logowania (LoginView.vue) i rejestracji (RegisterView.vue).

**Panel Główny (DashboardView.vue)**: Centralny punkt aplikacji po zalogowaniu, agregujący kluczowe akcje: rozpoczęcie nauki, generowanie fiszek i dostęp do listy fiszek.

**Generowanie i Recenzja**: Użytkownik wprowadza tekst w GenerateView.vue, a następnie przechodzi do ReviewView.vue, gdzie zarządza kandydatami na fiszki. Stan recenzji jest efemeryczny i zarządzany w generation.store.ts.

**Zarządzanie Fiszkami**: FlashcardsView.vue wyświetli listę wszystkich fiszek użytkownika. Edycja i usuwanie będą realizowane poprzez modalne okna dialogowe (EditFlashcardModal.vue, BaseConfirmModal.vue).

**Sesja Nauki**: LearningSessionView.vue poprowadzi użytkownika przez proces powtórek. Po zakończeniu sesji, LearningSummaryView.vue wyświetli podsumowanie.

**Inne**: StatisticsView.vue do prezentacji globalnych metryk, EmptyState.vue do obsługi pustych widoków.

**Integracja z API i Zarządzanie Stanem**:

**Warstwa API**: Komunikacja z backendem będzie wyizolowana w katalogu src/api, z osobnymi plikami dla każdego zasobu. Centralna instancja axios z interceptorami będzie zarządzać dodawaniem tokenów JWT i obsługą błędów.

**Zarządzanie Stanem (Pinia)**: Logika biznesowa i stan aplikacji zostaną umieszczone w modułach Pinia (auth, flashcards, learning, generation, ui). Moduły te będą orkiestrować wywołania API i zarządzać danymi.

**Globalne Stany**: ui.store.ts będzie zarządzał globalnym stanem ładowania, aktywując blokującą maskę (v-overlay) na czas każdego zapytania API.

**Responsywność, Dostępność i Bezpieczeństwo**:

**Responsywność**: Aplikacja będzie w pełni responsywna, wykorzystując system siatki Vuetify do adaptacji layoutu na urządzeniach mobilnych.

**Dostępność**: Użycie semantycznych komponentów Vuetify i dbałość o czytelne komunikaty błędów i stany puste przyczynią się do lepszej dostępności.

**Bezpieczeństwo**: Trasy będą chronione za pomocą Vue Router guards. Stan uwierzytelnienia i token JWT będą bezpiecznie zarządzane w auth.store.ts, a wygaśnięcie sesji będzie automatycznie obsługiwane.

**UI/UX**:

**Spójność**: Zapewniona przez zestaw komponentów bazowych, predefiniowane ikony i globalne style.

**Feedback dla użytkownika**: Aplikacja będzie dostarczać natychmiastowej informacji zwrotnej poprzez walidację formularzy "na żywo", globalną maskę ładowania oraz system powiadomień (toasts) dla błędów i sukcesów.

</ui_architecture_planning_summary>

<unresolved_issues>

Brak nierozwiązanych kwestii. Wszystkie punkty zostały wyjaśnione i uzgodnione, co pozwala na przejście do etapu implementacji.

</unresolved_issues>

</conversation_summary>
