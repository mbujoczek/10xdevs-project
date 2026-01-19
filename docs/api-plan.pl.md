# Plan API REST - AI Flashcard Generator

## 1. Zasoby

API udostępnia następujące główne zasoby mapowane na tabele bazy danych:

| Zasób              | Tabela bazy danych                    | Opis                                                    |
| ------------------ | ------------------------------------- | ------------------------------------------------------- |
| **Authentication** | Users                                 | Rejestracja użytkowników, logowanie i zarządzanie sesją |
| **Flashcards**     | Flashcards                            | Operacje CRUD dla fiszek użytkownika                    |
| **Generation**     | FlashcardGenerationEvents, Flashcards | Generowanie fiszek AI i proces recenzji                 |
| **Learning**       | Flashcards                            | Sesje nauki z powtórkami rozmieszczonymi w czasie       |
| **Statistics**     | FlashcardGenerationEvents             | Metryki użytkownika i analityka generowania             |

---

## 2. Punkty końcowe

### 2.1. Punkty końcowe uwierzytelniania

#### 2.1.1. Rejestracja nowego użytkownika

- **Metoda:** `POST`
- **Ścieżka:** `/api/auth/register`
- **Opis:** Tworzy nowe konto użytkownika z nazwą użytkownika i hasłem
- **Uwierzytelnianie:** Brak (publiczny punkt końcowy)

**Treść żądania:**

```json
{
  "username": "string (wymagane, max 50 znaków, wielkość liter ma znaczenie)",
  "password": "string (wymagane, min 8 znaków)"
}
```

**Odpowiedź sukcesu (201 Created):**

```json
{
  "id": 1,
  "username": "JanKowalski",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "createdAtUtc": "2025-12-31T10:00:00Z"
}
```

**Odpowiedzi błędów:**

- `400 Bad Request` - Walidacja nieudana (hasło za krótkie, pusta nazwa użytkownika)

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Wystąpił jeden lub więcej błędów walidacji.",
  "status": 400,
  "errors": {
    "password": ["Hasło musi mieć co najmniej 8 znaków"],
    "username": ["Nazwa użytkownika jest wymagana"]
  }
}
```

- `409 Conflict` - Nazwa użytkownika już istnieje

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Nazwa użytkownika już istnieje",
  "status": 409,
  "detail": "Użytkownik o nazwie 'JanKowalski' już istnieje."
}
```

---

#### 2.1.2. Logowanie użytkownika

- **Metoda:** `POST`
- **Ścieżka:** `/api/auth/login`
- **Opis:** Uwierzytelnia użytkownika i zwraca token JWT
- **Uwierzytelnianie:** Brak (publiczny punkt końcowy)

**Treść żądania:**

```json
{
  "username": "string (wymagane, wielkość liter ma znaczenie)",
  "password": "string (wymagane)"
}
```

**Odpowiedź sukcesu (200 OK):**

```json
{
  "id": 1,
  "username": "JanKowalski",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-31T22:00:00Z"
}
```

**Odpowiedzi błędów:**

- `400 Bad Request` - Nieprawidłowy format żądania
- `401 Unauthorized` - Nieprawidłowe dane uwierzytelniające

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Nieprawidłowe dane uwierzytelniające",
  "status": 401,
  "detail": "Nazwa użytkownika lub hasło jest nieprawidłowe."
}
```

---

### 2.2. Punkty końcowe generowania fiszek

#### 2.2.1. Generowanie fiszek z tekstu

- **Metoda:** `POST`
- **Ścieżka:** `/api/flashcards/generate`
- **Opis:** Wysyła tekst do modelu AI i generuje kandydatów na fiszki
- **Uwierzytelnianie:** Wymagane (token Bearer)

**Treść żądania:**

```json
{
  "inputText": "string (wymagane, max 10000 znaków)",
  "language": "string (opcjonalne, wartości: 'pl' lub 'en', domyślnie: 'en')"
}
```

**Odpowiedź sukcesu (201 Created):**

```json
{
  "generationEventId": 42,
  "candidatesCount": 8,
  "candidates": [
    {
      "candidateId": "temp-1",
      "question": "Jaka jest stolica Francji?",
      "answer": "Paryż"
    },
    {
      "candidateId": "temp-2",
      "question": "Jaka jest największa planeta w naszym układzie słonecznym?",
      "answer": "Jowisz"
    }
  ],
  "createdAtUtc": "2025-12-31T10:00:00Z"
}
```

**Odpowiedzi błędów:**

- `400 Bad Request` - Tekst wejściowy przekracza 10 000 znaków lub jest pusty

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Błąd walidacji",
  "status": 400,
  "errors": {
    "inputText": ["Tekst wejściowy nie może przekraczać 10000 znaków"]
  }
}
```

- `401 Unauthorized` - Brakujący lub nieprawidłowy token
- `503 Service Unavailable` - Usługa AI (Ollama) jest niedostępna

---

#### 2.2.2. Zakończenie recenzji fiszek

- **Metoda:** `POST`
- **Ścieżka:** `/api/flashcards/generation/{eventId}/complete`
- **Opis:** Finalizuje proces recenzji przez zapisanie zaakceptowanych/zmienionych fiszek i aktualizację metryk
- **Uwierzytelnianie:** Wymagane (token Bearer)
- **Parametry ścieżki:**
  - `eventId` (integer, wymagane) - Identyfikator zdarzenia generowania

**Treść żądania:**

```json
{
  "accepted": [
    {
      "candidateId": "temp-1",
      "question": "Jaka jest stolica Francji?",
      "answer": "Paryż"
    }
  ],
  "edited": [
    {
      "candidateId": "temp-2",
      "question": "Która planeta jest największa w naszym układzie słonecznym?",
      "answer": "Jowisz jest największą planetą w naszym układzie słonecznym."
    }
  ]
}
```

**Odpowiedź sukcesu (200 OK):**

```json
{
  "savedFlashcardsCount": 2,
  "acceptedCount": 1,
  "editedCount": 1,
  "rejectedCount": 2,
  "flashcardIds": [101, 102]
}
```

**Odpowiedzi błędów:**

- `400 Bad Request` - Walidacja nieudana (przekroczona długość pytania/odpowiedzi)

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Błąd walidacji",
  "status": 400,
  "errors": {
    "edited[0].question": ["Pytanie nie może przekraczać 200 znaków"],
    "edited[0].answer": ["Odpowiedź nie może przekraczać 500 znaków"]
  }
}
```

- `401 Unauthorized` - Brakujący lub nieprawidłowy token
- `403 Forbidden` - Zdarzenie należy do innego użytkownika
- `404 Not Found` - Zdarzenie generowania nie zostało znalezione
- `409 Conflict` - Recenzja została już zakończona dla tego zdarzenia

---

### 2.3. Punkty końcowe zarządzania fiszkami

#### 2.3.1. Wyświetlanie fiszek użytkownika

- **Metoda:** `GET`
- **Ścieżka:** `/api/flashcards`
- **Opis:** Pobiera wszystkie aktywne fiszki dla uwierzytelnionego użytkownika
- **Uwierzytelnianie:** Wymagane (token Bearer)
- **Parametry zapytania:**
  - `status` (integer, opcjonalne) - Filtrowanie według statusu (1=Zaakceptowane, 2=Zmodyfikowane). Obsługiwane są wartości wielokrotne.
  - `source` (integer, opcjonalne) - Filtrowanie według źródła (0=AI, 1=Ręczne)

**Odpowiedź sukcesu (200 OK):**

```json
{
  "flashcards": [
    {
      "id": 101,
      "question": "Jaka jest stolica Francji?",
      "answer": "Paryż",
      "source": 0,
      "status": 1,
      "srsNextRepetitionDate": "2025-12-31T10:00:00Z",
      "srsRepetitions": 3,
      "srsEaseFactor": 2.5,
      "createdAtUtc": "2025-12-20T10:00:00Z",
      "updatedAtUtc": "2025-12-30T15:30:00Z"
    },
    {
      "id": 102,
      "question": "Co to jest TypeScript?",
      "answer": "TypeScript to typowany nadzbiór JavaScript.",
      "source": 1,
      "status": 0,
      "srsNextRepetitionDate": null,
      "srsRepetitions": 0,
      "srsEaseFactor": 2.5,
      "createdAtUtc": "2025-12-25T08:00:00Z",
      "updatedAtUtc": "2025-12-25T08:00:00Z"
    }
  ],
  "totalCount": 2
}
```

**Odpowiedzi błędów:**

- `401 Unauthorized` - Brakujący lub nieprawidłowy token

---

#### 2.3.2. Pobieranie pojedynczej fiszki

- **Metoda:** `GET`
- **Ścieżka:** `/api/flashcards/{id}`
- **Opis:** Pobiera pojedynczą fiszkę według ID
- **Uwierzytelnianie:** Wymagane (token Bearer)
- **Parametry ścieżki:**
  - `id` (integer, wymagane) - Identyfikator fiszki

**Odpowiedź sukcesu (200 OK):**

```json
{
  "id": 101,
  "question": "Jaka jest stolica Francji?",
  "answer": "Paryż",
  "source": 0,
  "status": 1,
  "srsInterval": 7,
  "srsRepetitions": 3,
  "srsEaseFactor": 2.5,
  "srsNextRepetitionDate": "2025-12-31T10:00:00Z",
  "srsLastGrade": 4,
  "createdAtUtc": "2025-12-20T10:00:00Z",
  "updatedAtUtc": "2025-12-30T15:30:00Z"
}
```

**Odpowiedzi błędów:**

- `401 Unauthorized` - Brakujący lub nieprawidłowy token
- `403 Forbidden` - Fiszka należy do innego użytkownika
- `404 Not Found` - Fiszka nie została znaleziona lub usunięta

---

#### 2.3.3. Tworzenie ręcznej fiszki

- **Metoda:** `POST`
- **Ścieżka:** `/api/flashcards`
- **Opis:** Tworzy nową fiszkę ręcznie
- **Uwierzytelnianie:** Wymagane (token Bearer)

**Treść żądania:**

```json
{
  "question": "string (wymagane, max 200 znaków)",
  "answer": "string (wymagane, max 500 znaków)"
}
```

**Odpowiedź sukcesu (201 Created):**

```json
{
  "id": 103,
  "question": "Co to jest Vue.js?",
  "answer": "Vue.js to progresywny framework JavaScript do budowania interfejsów użytkownika.",
  "source": 1,
  "status": 0,
  "srsInterval": null,
  "srsRepetitions": 0,
  "srsEaseFactor": 2.5,
  "srsNextRepetitionDate": null,
  "srsLastGrade": null,
  "createdAtUtc": "2025-12-31T10:00:00Z",
  "updatedAtUtc": "2025-12-31T10:00:00Z"
}
```

**Odpowiedzi błędów:**

- `400 Bad Request` - Walidacja nieudana

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Błąd walidacji",
  "status": 400,
  "errors": {
    "question": [
      "Pytanie jest wymagane",
      "Pytanie nie może przekraczać 200 znaków"
    ],
    "answer": [
      "Odpowiedź jest wymagana",
      "Odpowiedź nie może przekraczać 500 znaków"
    ]
  }
}
```

- `401 Unauthorized` - Brakujący lub nieprawidłowy token

---

#### 2.3.4. Aktualizacja fiszki

- **Metoda:** `PUT`
- **Ścieżka:** `/api/flashcards/{id}`
- **Opis:** Aktualizuje pytanie i/lub odpowiedź istniejącej fiszki
- **Uwierzytelnianie:** Wymagane (token Bearer)
- **Parametry ścieżki:**
  - `id` (integer, wymagane) - Identyfikator fiszki

**Treść żądania:**

```json
{
  "question": "string (wymagane, max 200 znaków)",
  "answer": "string (wymagane, max 500 znaków)"
}
```

**Odpowiedź sukcesu (200 OK):**

```json
{
  "id": 103,
  "question": "Co to jest Vue 3?",
  "answer": "Vue 3 to najnowsza główna wersja Vue.js z obsługą Composition API.",
  "source": 1,
  "status": 0,
  "srsInterval": null,
  "srsRepetitions": 0,
  "srsEaseFactor": 2.5,
  "srsNextRepetitionDate": null,
  "srsLastGrade": null,
  "createdAtUtc": "2025-12-31T10:00:00Z",
  "updatedAtUtc": "2025-12-31T10:30:00Z"
}
```

**Odpowiedzi błędów:**

- `400 Bad Request` - Walidacja nieudana
- `401 Unauthorized` - Brakujący lub nieprawidłowy token
- `403 Forbidden` - Fiszka należy do innego użytkownika
- `404 Not Found` - Fiszka nie została znaleziona lub usunięta

---

#### 2.3.5. Usuwanie fiszki

- **Metoda:** `DELETE`
- **Ścieżka:** `/api/flashcards/{id}`
- **Opis:** Usuwa fiszkę programowo (ustawia Status na 3)
- **Uwierzytelnianie:** Wymagane (token Bearer)
- **Parametry ścieżki:**
  - `id` (integer, wymagane) - Identyfikator fiszki

**Odpowiedź sukcesu (204 No Content):**

- Pusta treść

**Odpowiedzi błędów:**

- `401 Unauthorized` - Brakujący lub nieprawidłowy token
- `403 Forbidden` - Fiszka należy do innego użytkownika
- `404 Not Found` - Fiszka nie została znaleziona lub już usunięta

---

### 2.4. Punkty końcowe sesji nauki

#### 2.4.1. Pobieranie fiszek do powtórki

- **Metoda:** `GET`
- **Ścieżka:** `/api/learning/due`
- **Opis:** Pobiera wszystkie fiszki do powtórki (gdzie SRSNextRepetitionDate <= aktualny czas UTC)
- **Uwierzytelnianie:** Wymagane (token Bearer)

**Odpowiedź sukcesu (200 OK):**

```json
{
  "flashcards": [
    {
      "id": 101,
      "question": "Jaka jest stolica Francji?",
      "answer": "Paryż",
      "srsRepetitions": 3,
      "srsEaseFactor": 2.5,
      "srsNextRepetitionDate": "2025-12-30T10:00:00Z"
    },
    {
      "id": 105,
      "question": "Co oznacza skrót API?",
      "answer": "Application Programming Interface",
      "srsRepetitions": 1,
      "srsEaseFactor": 2.5,
      "srsNextRepetitionDate": "2025-12-31T08:00:00Z"
    }
  ],
  "totalDueCount": 2
}
```

**Odpowiedzi błędów:**

- `401 Unauthorized` - Brakujący lub nieprawidłowy token

---

#### 2.4.2. Ocena fiszki

- **Metoda:** `POST`
- **Ścieżka:** `/api/learning/flashcards/{id}/rate`
- **Opis:** Przesyła ocenę użytkownika dla fiszki i aktualizuje parametry algorytmu SRS
- **Uwierzytelnianie:** Wymagane (token Bearer)
- **Parametry ścieżki:**
  - `id` (integer, wymagane) - Identyfikator fiszki

**Treść żądania:**

```json
{
  "grade": "integer (wymagane, 0-5)",
  "reviewedAtUtc": "string (opcjonalne, data i czas ISO 8601)"
}
```

**Skala ocen:**

- `0` - Całkowita pustka, brak przypomnienia
- `1` - Nieprawidłowa odpowiedź, ale po zobaczeniu prawidłowej odpowiedzi wydawała się znajoma
- `2` - Nieprawidłowa odpowiedź, ale prawidłowa odpowiedź wydawała się łatwa do zapamiętania
- `3` - Prawidłowa odpowiedź, ale wymagała znacznego wysiłku, aby przypomnieć
- `4` - Prawidłowa odpowiedź, z pewnym wahaniem
- `5` - Prawidłowa odpowiedź, doskonałe przypomnienie

**Odpowiedź sukcesu (200 OK):**

```json
{
  "id": 101,
  "srsInterval": 14,
  "srsRepetitions": 4,
  "srsEaseFactor": 2.6,
  "srsNextRepetitionDate": "2026-01-14T10:00:00Z",
  "srsLastGrade": 5,
  "updatedAtUtc": "2025-12-31T10:00:00Z"
}
```

**Odpowiedzi błędów:**

- `400 Bad Request` - Nieprawidłowa wartość oceny

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Błąd walidacji",
  "status": 400,
  "errors": {
    "grade": ["Ocena musi być między 0 a 5"]
  }
}
```

- `401 Unauthorized` - Brakujący lub nieprawidłowy token
- `403 Forbidden` - Fiszka należy do innego użytkownika
- `404 Not Found` - Fiszka nie została znaleziona lub usunięta

---

### 2.5. Punkty końcowe statystyk

#### 2.5.1. Pobieranie wskaźnika akceptacji generowania

- **Metoda:** `GET`
- **Ścieżka:** `/api/statistics/generation-acceptance`
- **Opis:** Pobiera globalne metryki akceptacji AI ze wszystkich użytkowników systemu do śledzenia sukcesu
- **Uwierzytelnianie:** Wymagane (token Bearer)

**Odpowiedź sukcesu (200 OK):**

```json
{
  "totalCandidates": 120,
  "acceptedWithoutEditing": 70,
  "acceptedAfterEditing": 25,
  "rejected": 25,
  "acceptanceRate": 0.792,
  "pureAcceptanceRate": 0.583,
  "meetsSuccessMetric": true,
  "targetRate": 0.75
}
```

**Definicje metryk:**

- `acceptanceRate`: (acceptedWithoutEditing + acceptedAfterEditing) / totalCandidates
- `pureAcceptanceRate`: acceptedWithoutEditing / totalCandidates (główna metryka PRD)
- `meetsSuccessMetric`: pureAcceptanceRate >= 0.75

**Odpowiedzi błędów:**

- `401 Unauthorized` - Brakujący lub nieprawidłowy token

---

## 3. Uwierzytelnianie i autoryzacja

### 3.1. Mechanizm uwierzytelniania

**Typ:** JSON Web Token (JWT) ze schematem uwierzytelniania Bearer

**Implementacja:**

- Poświadczenia użytkownika są weryfikowane względem zahaszowanych haseł przechowywanych w bazie danych
- Po pomyślnym uwierzytelnieniu wydawany jest token JWT zawierający:
  - `sub` (Subject): ID użytkownika
  - `username`: Nazwa użytkownika
  - `iat` (Issued At): Znacznik czasowy utworzenia tokenu
  - `exp` (Expiration): Znacznik czasowy wygaśnięcia tokenu (12 godzin od wydania)
- Token jest podpisywany za pomocą algorytmu HMAC-SHA256 z kluczem tajnym przechowywanym w konfiguracji aplikacji
- Klient umieszcza token w nagłówku Authorization: `Authorization: Bearer {token}`

**Odświeżanie tokenu:** Nie zaimplementowane w MVP. Użytkownicy muszą ponownie się uwierzytelnić po wygaśnięciu tokenu.

### 3.2. Zasady autoryzacji

**Izolacja danych użytkownika:**

- Wszystkie punkty końcowe (z wyjątkiem uwierzytelniania) wymagają prawidłowego tokenu JWT
- UserId jest wyodrębniany z roszczeń JWT, nigdy z treści żądania lub parametrów zapytania
- Wszystkie zapytania do bazy danych są automatycznie filtrowane według UserId z tokenu
- Próba dostępu do zasobów innego użytkownika zwraca `403 Forbidden`

**Macierz autoryzacji punktów końcowych:**

| Punkt końcowy                                      | Wymagane uwierzytelnianie | Logika autoryzacji                          |
| -------------------------------------------------- | ------------------------- | ------------------------------------------- |
| POST /api/auth/register                            | Nie                       | Publiczny                                   |
| POST /api/auth/login                               | Nie                       | Publiczny                                   |
| POST /api/auth/logout                              | Tak                       | Każdy uwierzytelniony użytkownik            |
| POST /api/flashcards/generate                      | Tak                       | Tylko własne dane użytkownika               |
| POST /api/flashcards/generation/{eventId}/complete | Tak                       | Tylko własne zdarzenia generowania          |
| GET /api/flashcards                                | Tak                       | Tylko własne fiszki                         |
| GET /api/flashcards/{id}                           | Tak                       | Tylko własne fiszki                         |
| POST /api/flashcards                               | Tak                       | Tworzy tylko dla własnego użytkownika       |
| PUT /api/flashcards/{id}                           | Tak                       | Tylko własne fiszki                         |
| DELETE /api/flashcards/{id}                        | Tak                       | Tylko własne fiszki                         |
| GET /api/learning/due                              | Tak                       | Tylko własne fiszki                         |
| POST /api/learning/flashcards/{id}/rate            | Tak                       | Tylko własne fiszki                         |
| GET /api/statistics/generation-acceptance          | Tak                       | Globalne statystyki wszystkich użytkowników |

### 3.3. Nagłówki bezpieczeństwa

Wszystkie odpowiedzi API zawierają następujące nagłówki bezpieczeństwa:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (tylko HTTPS)

---

## 4. Walidacja i logika biznesowa

### 4.1. Zasady walidacji żądań

**Żądania uwierzytelniania:**

- Nazwa użytkownika:
  - Wymagane
  - Maksymalnie 50 znaków
  - Wielkość liter ma znaczenie
  - Musi być unikalne (wymuszane na poziomie bazy danych z sortowaniem uwzględniającym wielkość liter)
- Hasło:
  - Wymagane
  - Minimum 8 znaków
  - Zahaszowane przy użyciu bcrypt przed zapisaniem (współczynnik kosztu 10)

**Żądania fiszek:**

- Pytanie:
  - Wymagane
  - Maksymalnie 200 znaków
  - Nie może być puste lub składać się tylko z białych znaków
- Odpowiedź:
  - Wymagane
  - Maksymalnie 500 znaków
  - Nie może być puste lub składać się tylko z białych znaków
- Źródło:
  - Musi być 0 (AI) lub 1 (Ręczne)
  - Ustawiane automatycznie na podstawie metody tworzenia
- Status:
  - Prawidłowe wartości: 0 (Nie dotyczy), 1 (Zaakceptowane), 2 (Zmodyfikowane), 3 (Usunięte)
  - Przejścia statusu są wymuszane przez logikę biznesową

**Żądania generowania:**

- Tekst wejściowy:
  - Wymagane
  - Maksymalnie 10 000 znaków
  - Minimum 50 znaków (wymóg praktyczny dla znaczącego generowania)
- Język:
  - Opcjonalne
  - Prawidłowe wartości: 'pl' (polski), 'en' (angielski)
  - Domyślnie: 'en'

**Żądania nauki:**

- Ocena:
  - Wymagane
  - Musi być liczbą całkowitą między 0 a 5 (włącznie)
  - Używane przez algorytm SM-2 do obliczania następnego interwału powtórek

### 4.2. Implementacja logiki biznesowej

#### 4.2.1. Przepływ pracy generowania fiszek

**Komenda:** `GenerateFlashcardsCommand`
**Handler:** `GenerateFlashcardsCommandHandler`

**Proces:**

1. Walidacja długości tekstu wejściowego (50-10 000 znaków)
2. Utworzenie rekordu `FlashcardGenerationEvent` ze stanem początkowym:
   - UserId z roszczeń JWT
   - CandidatesCount = 0
   - AcceptedCount = 0
   - EditedCount = 0
3. Wywołanie API Ollama ze strukturalnym promptem:

   ```
   Wygeneruj {n} fiszek z następującego tekstu w języku {language}.
   Zwróć tablicę JSON z obiektami zawierającymi pola 'question' i 'answer'.

   Tekst: {inputText}
   ```

4. Parsowanie odpowiedzi JSON i walidacja struktury
5. Aktualizacja `FlashcardGenerationEvent.CandidatesCount`
6. Zwracanie kandydatów z tymczasowymi ID (jeszcze nietrwałych)
7. Przechowywanie kandydatów w pamięci podręcznej rozproszonej (Redis/Memory) z wygaśnięciem po 30 minutach

**Obsługa błędów:**

- Limit czasu API Ollama (30 sekund): Zwrócenie 503 Service Unavailable
- Nieprawidłowa odpowiedź JSON: Logowanie błędu, zwrócenie 502 Bad Gateway
- Wygenerowano zero kandydatów: Zwrócenie 200 OK z pustą tablicą i komunikatem ostrzegawczym

#### 4.2.2. Przepływ pracy zakończenia recenzji

**Komenda:** `CompleteFlashcardReviewCommand`
**Handler:** `CompleteFlashcardReviewCommandHandler`

**Proces:**

1. Walidacja, że zdarzenie generowania istnieje i należy do uwierzytelnionego użytkownika
2. Sprawdzenie, czy zdarzenie nie zostało już zakończone (zapobieganie duplikatom przesyłań)
3. Walidacja wszystkich pytań i odpowiedzi względem ograniczeń długości
4. Rozpoczęcie transakcji bazy danych
5. Dla każdej zaakceptowanej fiszki:
   - Utworzenie rekordu `Flashcard` z Source=0 (AI), Status=1 (Zaakceptowane)
   - Inkrementacja AcceptedCount
6. Dla każdej zmodyfikowanej fiszki:
   - Utworzenie rekordu `Flashcard` z Source=0 (AI), Status=2 (Zmodyfikowane)
   - Inkrementacja EditedCount
7. Aktualizacja `FlashcardGenerationEvent` z ostatecznymi liczbami
8. Zatwierdzenie transakcji
9. Wyczyszczenie kandydatów z pamięci podręcznej
10. Zwrócenie podsumowania z utworzonymi ID fiszek

**Zasady biznesowe:**

- Kandydaci mogą być zaakceptowani/zmodyfikowani/odrzuceni tylko raz
- Suma zaakceptowanych + zmodyfikowanych + odrzuconych musi równać candidatesCount
- Zakończenie recenzji jest idempotentne (kolejne wywołania zwracają ten sam wynik)

#### 4.2.3. Algorytm powtórek rozmieszczonych w czasie (SM-2)

**Komenda:** `RateFlashcardCommand`
**Handler:** `RateFlashcardCommandHandler`

**Implementacja algorytmu:**
Używa algorytmu SuperMemo SM-2 poprzez bibliotekę open-source (np. `SuperMemoAssistant.Interop` lub implementację niestandardową)

**Proces:**

1. Pobranie fiszki i walidacja własności
2. Wyodrębnienie bieżących parametrów SRS:
   - Interwał (dni od ostatniej recenzji)
   - Liczba powtórek
   - Współczynnik łatwości (domyślnie 2.5)
3. Zastosowanie algorytmu SM-2 na podstawie oceny:
   - Ocena < 3: Resetowanie powtórek do 0, interwału do 1 dnia
   - Ocena >= 3: Obliczanie nowego interwału na podstawie współczynnika łatwości
   - Aktualizacja współczynnika łatwości: EF' = EF + (0.1 - (5 - ocena) _ (0.08 + (5 - ocena) _ 0.02))
4. Obliczanie następnej daty powtórki: DataBieżąca + Interwał
5. Aktualizacja fiszki z nowymi parametrami SRS
6. Zatwierdzenie zmian i zwrócenie zaktualizowanej fiszki

**Formuła SM-2:**

- Jeśli ocena < 3:
  - Interwał = 1 dzień
  - Powtórki = 0
- Jeśli ocena >= 3:
  - Jeśli powtórki = 0: Interwał = 1 dzień
  - Jeśli powtórki = 1: Interwał = 6 dni
  - Jeśli powtórki > 1: Interwał = Poprzedni Interwał × Współczynnik Łatwości
  - Powtórki += 1

**Dostosowanie współczynnika łatwości:**

- EF = EF + (0.1 - (5 - ocena) × (0.08 + (5 - ocena) × 0.02))
- Minimalne EF: 1.3

#### 4.2.4. Implementacja usuwania programowego

**Komenda:** `DeleteFlashcardCommand`
**Handler:** `DeleteFlashcardCommandHandler`

**Proces:**

1. Walidacja, że fiszka istnieje i należy do użytkownika
2. Sprawdzenie bieżącego statusu:
   - Jeśli Status = 3 (już usunięte): Zwrócenie 404 Not Found
   - W przeciwnym razie: Aktualizacja Status na 3 (Usunięte)
3. Ustawienie UpdatedAtUtc na bieżący czas UTC
4. Zatwierdzenie zmian
5. Zwrócenie 204 No Content

**Zasady biznesowe:**

- Usunięte fiszki są wyłączone ze wszystkich zapytań listy
- Usunięte fiszki nigdy nie pojawiają się w sesjach nauki
- Usunięte fiszki zachowują historię SRS do potencjalnej przyszłej analityki
- Brak funkcjonalności trwałego usuwania w MVP (może być dodana dla zgodności z GDPR)

#### 4.2.5. Obliczanie metryk sukcesu

**Zapytanie:** `GetGenerationAcceptanceRateQuery`
**Handler:** `GetGenerationAcceptanceRateQueryHandler`

**Obliczanie:**

1. Pobranie wszystkich rekordów `FlashcardGenerationEvent` ze wszystkich użytkowników systemu
2. Sumowanie sum:
   - Całkowita liczba kandydatów: SUM(CandidatesCount)
   - Całkowita liczba zaakceptowanych: SUM(AcceptedCount)
   - Całkowita liczba zmodyfikowanych: SUM(EditedCount)
3. Obliczanie wskaźników:
   - Czysty wskaźnik akceptacji = Całkowita liczba zaakceptowanych / Całkowita liczba kandydatów
   - Ogólny wskaźnik akceptacji = (Całkowita liczba zaakceptowanych + Całkowita liczba zmodyfikowanych) / Całkowita liczba kandydatów
4. Porównanie czystego wskaźnika akceptacji z celem (0.75)
5. Zwrócenie kompleksowych metryk

**Metryki sukcesu PRD:**

- **Główna metryka:** Czysty wskaźnik akceptacji >= 75%
  - Mierzy fiszki zaakceptowane bez żadnych edycji
  - Formuła: AcceptedCount / CandidatesCount >= 0.75
- **Metryka drugorzędna:** Adopcja funkcji AI >= 75%
  - Mierzy stosunek fiszek wygenerowanych przez AI do ręcznych
  - Formuła: (Fiszki z Source=0) / (Całkowita liczba fiszek) >= 0.75

### 4.3. Strategia obsługi błędów

**Format odpowiedzi błędów (RFC 7807 Problem Details):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Wystąpił jeden lub więcej błędów walidacji.",
  "status": 400,
  "detail": "Zobacz właściwość errors dla szczegółów.",
  "errors": {
    "fieldName": ["Komunikat błędu 1", "Komunikat błędu 2"]
  },
  "traceId": "00-abc123-def456-00"
}
```

**Użycie kodów statusu HTTP:**

- `200 OK` - Pomyślne GET, PUT, POST z treścią odpowiedzi
- `201 Created` - Pomyślne POST tworzące nowy zasób
- `204 No Content` - Pomyślne DELETE lub POST bez treści odpowiedzi
- `400 Bad Request` - Błędy walidacji, nieprawidłowe żądania
- `401 Unauthorized` - Brakujący lub nieprawidłowy token uwierzytelniania
- `403 Forbidden` - Prawidłowy token, ale niewystarczające uprawnienia
- `404 Not Found` - Zasób nie istnieje lub został usunięty
- `409 Conflict` - Nazwa użytkownika już istnieje, duplikat przesłania
- `422 Unprocessable Entity` - Żądanie jest prawidłowe, ale logika biznesowa uniemożliwia przetwarzanie
- `500 Internal Server Error` - Nieoczekiwane błędy serwera
- `502 Bad Gateway` - API Ollama zwróciło nieprawidłową odpowiedź
- `503 Service Unavailable` - API Ollama jest niedostępne lub przekroczenie limitu czasu

**Strategia logowania:**

- Wszystkie błędy logowane do tabeli `Logs` przez Serilog
- Uwzględnienie ID korelacji/śledzenia we wszystkich odpowiedziach do debugowania
- Poziomy logowania:
  - Informacja: Pomyślne operacje z metrykami
  - Ostrzeżenie: Niepowodzenia walidacji, naruszenia zasad biznesowych
  - Błąd: Nieoczekiwane wyjątki, niepowodzenia usług zewnętrznych
  - Krytyczny: Niepowodzenia połączenia z bazą danych, błędy systemu uwierzytelniania

### 4.4. Implementacja wzorca CQRS

**Komendy (operacje zapisu):**

- `RegisterUserCommand`
- `LoginUserCommand`
- `GenerateFlashcardsCommand`
- `CompleteFlashcardReviewCommand`
- `CreateFlashcardCommand`
- `UpdateFlashcardCommand`
- `DeleteFlashcardCommand`
- `RateFlashcardCommand`

**Zapytania (operacje odczytu):**

- `GetFlashcardsQuery`
- `GetFlashcardByIdQuery`
- `GetGenerationCandidatesQuery`
- `GetDueFlashcardsQuery`
- `GetUserStatisticsQuery`
- `GetGenerationAcceptanceRateQuery`

**Zachowania potoku MediatR:**

- `ValidationBehavior<TRequest, TResponse>` - Waliduje żądania przy użyciu FluentValidation
- `LoggingBehavior<TRequest, TResponse>` - Loguje wszystkie komendy/zapytania z pomiarem czasu
- `TransactionBehavior<TRequest, TResponse>` - Opakowuje komendy w transakcje bazy danych
- `AuthorizationBehavior<TRequest, TResponse>` - Waliduje własność zasobów przez użytkownika

---

## 5. Wersjonowanie API

**Strategia:** Wersjonowanie ścieżki URI

**Bieżąca wersja:** v1 (niejawna w prefiksie `/api/`)

**Przyszłe wersjonowanie:** Gdy wprowadzane są przełomowe zmiany, użyj prefiksu `/api/v2/`

---

## 6. Konfiguracja CORS

**Dozwolone pochodzenia:**

- Rozwój: `http://localhost:5173` (serwer deweloperski Vite)
- Produkcja: Konfigurowane przez zmienną środowiskową

**Dozwolone metody:**

- GET, POST, PUT, DELETE, OPTIONS

**Dozwolone nagłówki:**

- Authorization, Content-Type, Accept

**Udostępnione nagłówki:**

- Content-Length, X-RateLimit-\*

**Poświadczenia:** Dozwolone (dla potencjalnych przyszłych funkcji opartych na plikach cookie)

---

## 7. Dokumentacja API

**Narzędzie:** Swagger/OpenAPI 3.0

**Punkty końcowe:**

- Rozwój: `http://localhost:5019/swagger`
- Produkcja: `/swagger` (opcjonalnie wyłączone w produkcji)

**Funkcje:**

- Interaktywne testowanie API
- Przykłady żądań/odpowiedzi
- Przepływ uwierzytelniania z wprowadzaniem tokenu JWT
- Definicje schematów dla wszystkich DTO
- Przykłady odpowiedzi błędów

---

## 8. Rozważania dotyczące wydajności

### 8.1. Optymalizacja zapytań do bazy danych

**Zapytania indeksowane:**

- Lista fiszek według użytkownika: Używa `IX_Flashcards_UserId`
- Pobieranie fiszek do powtórki: Używa `IX_Flashcards_SRSNextRepetitionDate` w połączeniu z `IX_Flashcards_UserId`
- Pobieranie aktywnych fiszek: Używa `IX_Flashcards_UserId_Status`

**Wzorce zapytań:**

- Wszystkie zapytania fiszek zawierają `WHERE UserId = @UserId AND Status != 3`
- Zapytania nauki dodają `AND SRSNextRepetitionDate <= GETUTCDATE()`
- Użycie `AsNoTracking()` dla zapytań tylko do odczytu

---

## 9. Wdrażanie i konfiguracja środowiska

### 9.1. Zmienne środowiskowe

**Wymagana konfiguracja:**

```
# Baza danych
ConnectionStrings__DefaultConnection=Server=...;Database=...

# JWT
Jwt__Secret=<klucz-tajny>
Jwt__Issuer=10xdevs-api
Jwt__Audience=10xdevs-client
Jwt__ExpirationHours=12

# Ollama
Ollama__BaseUrl=http://localhost:11434
Ollama__Model=llama3
Ollama__TimeoutSeconds=30

# Serilog
Serilog__MinimumLevel=Information

# CORS
Cors__AllowedOrigins=http://localhost:5173
```
