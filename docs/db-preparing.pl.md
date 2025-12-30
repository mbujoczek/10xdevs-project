<conversation_summary>

<decisions>

1. Preferencje użytkownika (np. język) będą przechowywane w `localStorage` przeglądarki, a nie w bazie danych.
2. Zostanie utworzona nowa tabela `FlashcardGenerationEvents` do logowania metryk użycia generatora AI. Będzie ona zawierać `UserId`, datę, liczbę zaproponowanych kandydatów oraz finalną liczbę zaakceptowanych/zedytowanych fiszek.
3. Konta użytkowników nie będą usuwane. Fiszki usuwane przez użytkownika będą oznaczane jako usunięte (soft delete) poprzez zmianę statusu w kolumnie `Status` na 'Deleted'.
4. Oryginalny tekst, z którego generowane są fiszki, nie będzie przechowywany w bazie danych.
5. Na poziomie bazy danych nie będzie implementowany mechanizm ograniczający częstotliwość generowania fiszek (rate limiting).
6. Dla ręcznie tworzonych fiszek, kolumna `Source` będzie domyślnie ustawiona na 'Manual', a `Status` na 'Not applicable', co zostanie zrealizowane jako `DEFAULT` w schemacie bazy danych.
7. Do tabeli `Flashcards` zostanie dodana kolumna `SRSLastGrade` (typu `int`) do przechowywania ostatniej oceny fiszki.
8. Wszystkie obiekty bazy danych (tabele, kolumny) będą nazwane w języku angielskim.
9. Do tabel `Users`, `Flashcards`, `FlashcardGenerationEvents` zostaną dodane kolumny audytowe `CreatedAtUtc` i `UpdatedAtUtc`. 10. Klucze główne w tabelach będą typu `INT`.
10. Kolumna `Question` będzie miała maksymalną długość 200 znaków, a `Answer` 500 znaków.
11. Błędy będą logowane do dedykowanej tabeli w bazie danych przy użyciu biblioteki Serilog.

</decisions>

<matched_recommendations>

1. Hasła użytkowników będą przechowywane w formie hashowanej, a nie jako czysty tekst.
2. W tabeli `Flashcards` zostanie dodana kolumna `Source` ('AI' lub 'Manual') w celu rozróżnienia pochodzenia fiszek.
3. Do tabeli `Flashcards` zostaną dodane dedykowane kolumny do przechowywania stanu algorytmu SRS (`SRSInterval`, `SRSRepetitions`, `SRSEaseFactor`, `SRSNextRepetitionDate`, `SRSLastGrade`).
4. Każda fiszka będzie powiązana z użytkownikiem za pomocą klucza obcego `UserId`, co zapewni izolację danych.
5. Zostaną utworzone nieklastrowane indeksy na kolumnach `UserId` i `SRSNextRepetitionDate` w tabeli `Flashcards` w celu optymalizacji zapytań.
6. Nazwa użytkownika (`Username`) będzie unikalna i wrażliwa na wielkość liter.
7. Zostanie utworzona dedykowana tabela (`FlashcardGenerationEvents`) do śledzenia zdarzeń generowania fiszek przez AI.
8. Zostaną dodane kolumny audytowe (`CreatedAtUtc`, `UpdatedAtUtc`) do tabel przechowujących dane biznesowe.

</matched_recommendations>

<database_planning_summary>

Na podstawie przeprowadzonych dyskusji, schemat bazy danych SQL Server dla MVP projektu "AI Flashcard Generator" będzie składał się z czterech głównych tabel: `Users`, `Flashcards`, `FlashcardGenerationEvents` oraz `Logs`.

Główne wymagania dotyczące schematu:

Schemat ma wspierać podstawowe funkcjonalności aplikacji: uwierzytelnianie użytkowników, zarządzanie fiszkami, mechanizm powtórek SRS oraz zbieranie metryk dotyczących wykorzystania AI. Wszystkie nazwy obiektów będą w języku angielskim. Kolumny Question i Answer będą miały ograniczone długości (odpowiednio NVARCHAR(200) i NVARCHAR(500)). Klucze główne będą typu INT.

Kluczowe encje i ich relacje:

1. Users: Przechowuje dane uwierzytelniające. Zawiera Id (PK), unikalny i wrażliwy na wielkość liter Username oraz PasswordHash.
2. Flashcards: Główna tabela przechowująca wszystkie fiszki. Posiada relację wiele-do-jednego z tabelą Users poprzez klucz obcy UserId. Zawiera kolumny na treść (Question, Answer), pochodzenie (Source), status (Status, w tym 'Deleted' dla soft delete) oraz kompletny zestaw pól dla algorytmu SRS z prefiksem SRS (SRSInterval, SRSRepetitions, SRSEaseFactor, SRSNextRepetitionDate, SRSLastGrade).
3. FlashcardGenerationEvents: Tabela do logowania metryk. Posiada relację wiele-do-jednego z Users (UserId). Przechowuje informacje o każdym zdarzeniu generowania fiszek, w tym liczbę kandydatów i liczbę finalnie zaakceptowanych kart.
4. Logs: Tabela techniczna, tworzona i zarządzana przez Serilog, do przechowywania logów błędów z aplikacji backendowej. Jej struktura będzie zgodna ze standardowym schematem Serilog SQL Server Sink.

Bezpieczeństwo i skalowalność:
· Bezpieczeństwo: Hasła użytkowników będą hashowane. Izolacja danych między użytkownikami będzie zapewniona na poziomie aplikacji poprzez filtrowanie wszystkich zapytań po UserId zalogowanego użytkownika.
· Skalowalność i wydajność: Zostaną utworzone indeksy na kluczach obcych (UserId) oraz na kolumnach często używanych w klauzulach WHERE (np. SRSNextRepetitionDate), aby zapewnić wysoką wydajność zapytań. Użycie typu INT dla kluczy głównych jest wystarczające dla skali MVP.

</database_planning_summary>

<unresolved_issues>

- Należy zdefiniować dokładną strukturę tabeli `Logs` generowanej przez Serilog lub potwierdzić, że zostanie użyty standardowy schemat dostarczany przez bibliotekę Serilog.Sinks.MSSqlServer.
- Należy zdefiniować, jakie wartości początkowe (poza `NULL`) powinny przyjmować kolumny `AcceptedCount` i `EditedCount` w tabeli `FlashcardGenerationEvents` w momencie tworzenia rekordu, zanim użytkownik zakończy recenzję.

</unresolved_issues>

</conversation_summary>
