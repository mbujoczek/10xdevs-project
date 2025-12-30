# Schemat Bazy Danych - AI Flashcard Generator

## 1. Tabele

### 1.1. Users

Przechowuje dane uwierzytelniające użytkowników.

| Kolumna      | Typ danych    | Ograniczenia                   | Opis                                           |
| ------------ | ------------- | ------------------------------ | ---------------------------------------------- |
| Id           | INT           | PRIMARY KEY IDENTITY(1,1)      | Unikalny identyfikator użytkownika             |
| Username     | NVARCHAR(50)  | NOT NULL, UNIQUE               | Nazwa użytkownika (wrażliwa na wielkość liter) |
| PasswordHash | NVARCHAR(255) | NOT NULL                       | Zahashowane hasło użytkownika                  |
| CreatedAtUtc | DATETIME2     | NOT NULL, DEFAULT GETUTCDATE() | Data i czas utworzenia konta (UTC)             |
| UpdatedAtUtc | DATETIME2     | NOT NULL, DEFAULT GETUTCDATE() | Data i czas ostatniej aktualizacji (UTC)       |

**Indeksy:**

- `PK_Users` - Klucz główny na kolumnie `Id`
- `UQ_Users_Username` - Unikalny indeks na kolumnie `Username` (z opcją case-sensitive)

---

### 1.2. Flashcards

Główna tabela przechowująca wszystkie fiszki użytkowników.

| Kolumna               | Typ danych    | Ograniczenia                                          | Opis                                                              |
| --------------------- | ------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Id                    | INT           | PRIMARY KEY IDENTITY(1,1)                             | Unikalny identyfikator fiszki                                     |
| UserId                | INT           | NOT NULL, FOREIGN KEY REFERENCES Users(Id)            | Identyfikator właściciela fiszki                                  |
| Question              | NVARCHAR(200) | NOT NULL                                              | Pytanie na fiszce                                                 |
| Answer                | NVARCHAR(500) | NOT NULL                                              | Odpowiedź na fiszce                                               |
| Source                | INT           | NOT NULL, DEFAULT 1, CHECK (Source IN (0, 1))         | Źródło pochodzenia fiszki (0=AI, 1=Manual)                        |
| Status                | INT           | NOT NULL, DEFAULT 0, CHECK (Status IN (0, 1, 2, 3))   | Status fiszki (0=Not applicable, 1=Accepted, 2=Edited, 3=Deleted) |
| SRSInterval           | INT           | NULL                                                  | Interwał powtórek w dniach (algorytm SRS)                         |
| SRSRepetitions        | INT           | NULL, DEFAULT 0                                       | Liczba wykonanych powtórek                                        |
| SRSEaseFactor         | DECIMAL(4,2)  | NULL, DEFAULT 2.5                                     | Współczynnik łatwości (algorytm SRS)                              |
| SRSNextRepetitionDate | DATETIME2     | NULL                                                  | Data następnej zaplanowanej powtórki                              |
| SRSLastGrade          | INT           | NULL, CHECK (SRSLastGrade >= 0 AND SRSLastGrade <= 5) | Ostatnia ocena fiszki (0-5)                                       |
| CreatedAtUtc          | DATETIME2     | NOT NULL, DEFAULT GETUTCDATE()                        | Data i czas utworzenia fiszki (UTC)                               |
| UpdatedAtUtc          | DATETIME2     | NOT NULL, DEFAULT GETUTCDATE()                        | Data i czas ostatniej aktualizacji (UTC)                          |

**Indeksy:**

- `PK_Flashcards` - Klucz główny na kolumnie `Id`
- `IX_Flashcards_UserId` - Nieklastrowany indeks na kolumnie `UserId`
- `IX_Flashcards_SRSNextRepetitionDate` - Nieklastrowany indeks na kolumnie `SRSNextRepetitionDate`
- `IX_Flashcards_UserId_Status` - Złożony indeks na kolumnach `UserId`, `Status` (optymalizacja zapytań o aktywne fiszki)

---

### 1.3. FlashcardGenerationEvents

Tabela do logowania metryk generowania fiszek przez AI.

| Kolumna         | Typ danych | Ograniczenia                               | Opis                                       |
| --------------- | ---------- | ------------------------------------------ | ------------------------------------------ |
| Id              | INT        | PRIMARY KEY IDENTITY(1,1)                  | Unikalny identyfikator zdarzenia           |
| UserId          | INT        | NOT NULL, FOREIGN KEY REFERENCES Users(Id) | Identyfikator użytkownika                  |
| CandidatesCount | INT        | NOT NULL                                   | Liczba wygenerowanych kandydatów na fiszki |
| AcceptedCount   | INT        | NOT NULL, DEFAULT 0                        | Liczba zaakceptowanych fiszek bez edycji   |
| EditedCount     | INT        | NOT NULL, DEFAULT 0                        | Liczba fiszek zaakceptowanych po edycji    |
| CreatedAtUtc    | DATETIME2  | NOT NULL, DEFAULT GETUTCDATE()             | Data i czas utworzenia rekordu (UTC)       |
| UpdatedAtUtc    | DATETIME2  | NOT NULL, DEFAULT GETUTCDATE()             | Data i czas ostatniej aktualizacji (UTC)   |

**Indeksy:**

- `PK_FlashcardGenerationEvents` - Klucz główny na kolumnie `Id`
- `IX_FlashcardGenerationEvents_UserId` - Nieklastrowany indeks na kolumnie `UserId`

---

### 1.4. Logs

Tabela techniczna do przechowywania logów błędów aplikacji, zarządzana przez bibliotekę Serilog.

Struktura zostanie utworzona automatycznie przez Serilog.Sinks.MSSqlServer zgodnie ze standardowym schematem biblioteki. Minimalna struktura obejmuje:

| Kolumna         | Typ danych    | Opis                                                 |
| --------------- | ------------- | ---------------------------------------------------- |
| Id              | INT           | Unikalny identyfikator wpisu logu                    |
| Message         | NVARCHAR(MAX) | Wiadomość logu                                       |
| MessageTemplate | NVARCHAR(MAX) | Szablon wiadomości                                   |
| Level           | NVARCHAR(128) | Poziom logowania (Error, Warning, Information, itp.) |
| TimeStamp       | DATETIME2     | Czas zdarzenia                                       |
| Exception       | NVARCHAR(MAX) | Szczegóły wyjątku (jeśli występuje)                  |
| Properties      | NVARCHAR(MAX) | Dodatkowe właściwości w formacie XML/JSON            |

**Uwaga:** Dokładna struktura tabeli Logs zostanie zdefiniowana przez konfigurację Serilog w aplikacji backendowej.

---

## 2. Relacje Między Tabelami

### 2.1. Users → Flashcards

- **Typ relacji:** Jeden-do-wielu (1:N)
- **Opis:** Każdy użytkownik może posiadać wiele fiszek, ale każda fiszka należy do dokładnie jednego użytkownika.
- **Klucz obcy:** `Flashcards.UserId` → `Users.Id`
- **Akcja CASCADE:** ON DELETE CASCADE - usunięcie użytkownika spowoduje usunięcie wszystkich jego fiszek (w MVP nie planowane usuwanie kont)

### 2.2. Users → FlashcardGenerationEvents

- **Typ relacji:** Jeden-do-wielu (1:N)
- **Opis:** Każdy użytkownik może mieć wiele zdarzeń generowania fiszek, ale każde zdarzenie należy do dokładnie jednego użytkownika.
- **Klucz obcy:** `FlashcardGenerationEvents.UserId` → `Users.Id`
- **Akcja CASCADE:** ON DELETE CASCADE - usunięcie użytkownika spowoduje usunięcie wszystkich jego metryk (w MVP nie planowane usuwanie kont)

---

## 3. Indeksy

### 3.1. Indeksy Podstawowe (PRIMARY KEY)

- `PK_Users` - Klaster na `Users.Id`
- `PK_Flashcards` - Klaster na `Flashcards.Id`
- `PK_FlashcardGenerationEvents` - Klaster na `FlashcardGenerationEvents.Id`

### 3.2. Indeksy Unikalne (UNIQUE)

- `UQ_Users_Username` - Unikalny indeks na `Users.Username`
  - **Collation:** Należy użyć collation wrażliwej na wielkość liter (np. `SQL_Latin1_General_CP1_CS_AS`) dla zapewnienia case-sensitivity nazw użytkowników

### 3.3. Indeksy Wydajnościowe (NONCLUSTERED)

#### Tabela Flashcards:

- `IX_Flashcards_UserId` - Optymalizacja zapytań filtrujących po właścicielu
- `IX_Flashcards_SRSNextRepetitionDate` - Optymalizacja zapytań dla sesji nauki (fiszki do powtórki)
- `IX_Flashcards_UserId_Status` - Złożony indeks do szybkiego pobierania aktywnych fiszek użytkownika

#### Tabela FlashcardGenerationEvents:

- `IX_FlashcardGenerationEvents_UserId` - Optymalizacja zapytań do analizy metryk użytkownika

---

## 4. Ograniczenia i Reguły Biznesowe

### 4.1. Check Constraints

- `CK_Flashcards_Source` - Kolumna `Source` może przyjąć tylko wartości liczbowe: 0 (AI), 1 (Manual)
- `CK_Flashcards_Status` - Kolumna `Status` może przyjąć tylko wartości liczbowe: 0 (Not applicable), 1 (Accepted), 2 (Edited), 3 (Deleted)
- `CK_Flashcards_SRSLastGrade` - Kolumna `SRSLastGrade` może przyjąć tylko wartości NULL lub od 0 do 5 (włącznie)

### 4.2. Default Values

- Wszystkie kolumny `CreatedAtUtc` i `UpdatedAtUtc` mają domyślną wartość `GETUTCDATE()`
- `Flashcards.Source` - DEFAULT 1 (Manual - dla fiszek tworzonych ręcznie)
- `Flashcards.Status` - DEFAULT 0 (Not applicable)
- `Flashcards.SRSRepetitions` - DEFAULT 0
- `Flashcards.SRSEaseFactor` - DEFAULT 2.5 (standardowa wartość początkowa dla algorytmu SM-2)
- `FlashcardGenerationEvents.AcceptedCount` - DEFAULT 0
- `FlashcardGenerationEvents.EditedCount` - DEFAULT 0

### 4.3. Foreign Key Constraints

- `FK_Flashcards_UserId` - Klucz obcy z `Flashcards.UserId` do `Users.Id` z ON DELETE CASCADE
- `FK_FlashcardGenerationEvents_UserId` - Klucz obcy z `FlashcardGenerationEvents.UserId` do `Users.Id` z ON DELETE CASCADE

---

## 5. Dodatkowe Uwagi i Decyzje Projektowe

### 5.1. Obsługa Strefy Czasowej

Wszystkie kolumny przechowujące datę i czas używają typu `DATETIME2` i przechowują wartości w UTC. Konwersja na lokalną strefę czasową użytkownika będzie wykonywana na poziomie aplikacji frontendowej.

### 5.2. Soft Delete

Fiszki użytkowników nie są fizycznie usuwane z bazy danych. Zamiast tego, kolumna `Flashcards.Status` jest zmieniana na 3 (Deleted). Umożliwia to potencjalne przywrócenie danych w przyszłości oraz zachowanie integralności metryk.

### 5.3. Izolacja Danych Użytkowników

Wszystkie zapytania pobierające dane fiszek muszą być filtrowane po `UserId` zalogowanego użytkownika na poziomie aplikacji backendowej, aby zapewnić pełną izolację danych między użytkownikami.

### 5.4. Case-Sensitivity dla Username

Tabela `Users` wymaga indeksu na kolumnie `Username` z collation wrażliwą na wielkość liter. Należy to skonfigurować podczas tworzenia indeksu:

```sql
CREATE UNIQUE INDEX UQ_Users_Username
ON Users(Username)
WHERE Username IS NOT NULL
COLLATE SQL_Latin1_General_CP1_CS_AS;
```

### 5.5. Algorytm Spaced Repetition System (SRS)

Schemat zawiera pełny zestaw kolumn niezbędnych do obsługi algorytmu powtórek rozłożonych w czasie (np. SM-2):

- `SRSInterval` - przechowuje obliczony interwał między powtórkami
- `SRSRepetitions` - licznik wykonanych powtórek
- `SRSEaseFactor` - współczynnik łatwości używany przez algorytm do dostosowania interwałów
- `SRSNextRepetitionDate` - data następnej zaplanowanej powtórki (używana do wyboru fiszek w sesji nauki)
- `SRSLastGrade` - ostatnia ocena użytkownika (0-5), używana do rekalibracji algorytmu

### 5.6. Metryki AI i Analityka

Tabela `FlashcardGenerationEvents` została zaprojektowana do wspierania metryk sukcesu zdefiniowanych w PRD:

- **Wskaźnik Akceptacji AI** - obliczany jako `AcceptedCount / CandidatesCount`

### 5.7. Audit Trail

Kolumny `CreatedAtUtc` i `UpdatedAtUtc` zapewniają podstawowy audit trail dla wszystkich kluczowych tabel biznesowych. Kolumna `UpdatedAtUtc` jest automatycznie aktualizowana za pomocą triggera SQL przy każdej modyfikacji rekordu.

### 5.8. Długość Pól Tekstowych

- `Username` - NVARCHAR(50) - wystarczająca długość dla nazw użytkowników
- `PasswordHash` - NVARCHAR(255) - wystarczająca dla popularnych algorytmów hashowania (bcrypt, SHA-256)
- `Question` - NVARCHAR(200) - zgodnie z wymaganiami z notatek sesji planowania
- `Answer` - NVARCHAR(500) - zgodnie z wymaganiami z notatek sesji planowania

### 5.9. Normalizacja

Schemat jest znormalizowany do 3NF (Third Normal Form):

- Brak powtarzających się grup danych
- Wszystkie atrybuty zależą od całego klucza głównego
- Brak zależności przechodnich między atrybutami niebędącymi kluczami

### 5.10. Skalowalność

Dla MVP zakładane jest użycie kluczy głównych typu `INT` (zakres do ~2.1 miliarda rekordów). W przypadku przyszłego wzrostu można rozważyć migrację do `BIGINT` dla tabel o dużym obrocie (np. `Flashcards`, `FlashcardGenerationEvents`).

### 5.11. Wydajność Zapytań

Indeksy zostały zaprojektowane z myślą o najczęstszych operacjach:

- Pobieranie wszystkich aktywnych fiszek użytkownika
- Pobieranie fiszek do powtórki na podstawie `SRSNextRepetitionDate`
- Agregacja metryk generowania AI dla użytkownika

### 5.12. Migracje i Wersjonowanie

Schemat powinien być implementowany za pomocą migracji Entity Framework Core, co zapewni:

- Wersjonowanie zmian w schemacie
- Możliwość rollbacku
- Automatyczne zastosowanie zmian w różnych środowiskach (dev, staging, production)

---

## 6. Zalecenia Implementacyjne

1. **Triggery dla UpdatedAtUtc:** Utworzyć triggery SQL, które automatycznie aktualizują kolumnę `UpdatedAtUtc` przy każdej operacji UPDATE na tabelach `Users`, `Flashcards` i `FlashcardGenerationEvents`. Przykładowa implementacja triggera:

```sql
CREATE TRIGGER TR_Users_UpdatedAtUtc
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET UpdatedAtUtc = GETUTCDATE()
    FROM Users u
    INNER JOIN inserted i ON u.Id = i.Id
    WHERE u.UpdatedAtUtc = i.UpdatedAtUtc;
END;

CREATE TRIGGER TR_Flashcards_UpdatedAtUtc
ON Flashcards
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Flashcards
    SET UpdatedAtUtc = GETUTCDATE()
    FROM Flashcards f
    INNER JOIN inserted i ON f.Id = i.Id
    WHERE f.UpdatedAtUtc = i.UpdatedAtUtc;
END;

CREATE TRIGGER TR_FlashcardGenerationEvents_UpdatedAtUtc
ON FlashcardGenerationEvents
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE FlashcardGenerationEvents
    SET UpdatedAtUtc = GETUTCDATE()
    FROM FlashcardGenerationEvents fge
    INNER JOIN inserted i ON fge.Id = i.Id
    WHERE fge.UpdatedAtUtc = i.UpdatedAtUtc;
END;
```

2. **Partycjonowanie:** W przypadku bardzo dużej liczby fiszek lub zdarzeń, rozważyć partycjonowanie tabel `Flashcards` i `FlashcardGenerationEvents` według `UserId` lub dat czasowych dla poprawy wydajności.

3. **Archiwizacja Logów:** Tabela `Logs` może szybko rosnąć. Zaleca się wdrożenie polityki archiwizacji (np. przenoszenie starych logów do tabeli archiwum lub usuwanie po określonym czasie).

4. **Backup i Recovery:** Upewnić się, że strategia backupu obejmuje wszystkie tabele, szczególnie `Users` i `Flashcards`, które zawierają krytyczne dane użytkowników.

5. **Monitoring Wydajności:** Regularnie monitorować wydajność zapytań i statystyki użycia indeksów, aby zidentyfikować potencjalne wąskie gardła.
