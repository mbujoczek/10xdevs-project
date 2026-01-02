# Mechanizm Powtórek - Algorytm SM-2 (SuperMemo 2)

## Przegląd

System wykorzystuje algorytm SM-2 do optymalizacji interwałów powtórek flashcards. Im lepiej znasz materiał, tym rzadziej flashcard się pojawia. Im gorzej - tym częściej musisz go powtarzać.

## Skala Ocen (SRSGrade)

| Grade | Nazwa | Opis |
|-------|-------|------|
| 0 | CompleteBlackout | Kompletne zapomnienie - brak przypomnienia |
| 1 | IncorrectResponse | Nieprawidłowa odpowiedź, ale prawidłowa wydawała się znajoma |
| 2 | IncorrectResponseRecalled | Nieprawidłowa odpowiedź, ale prawidłowa była łatwa do przypomnienia |
| 3 | CorrectWithDifficulty | Prawidłowa odpowiedź po znacznym wysiłku |
| 4 | CorrectAfterHesitation | Prawidłowa odpowiedź z wahaniem |
| 5 | PerfectResponse | Perfekcyjna odpowiedź - natychmiastowe przypomnienie |

## Parametry SRS

- **SRSInterval**: Liczba dni do następnej powtórki
- **SRSRepetitions**: Liczba udanych powtórek (grade ≥ 3)
- **SRSEaseFactor**: Współczynnik łatwości (1.3 - 2.5), domyślnie 2.5
- **SRSNextRepetitionDate**: Data następnej zaplanowanej powtórki
- **SRSLastGrade**: Ostatnia przyznana ocena

## Kluczowe Zasady

### 1. Oceny 0-2 (Niepowodzenie)
- **Resetują postęp**: Repetitions → 0
- **Następny interval**: 1 dzień
- **EaseFactor**: Zostaje zaktualizowany (zwykle maleje)

### 2. Oceny 3-5 (Sukces)
- **Zwiększają repetitions**: +1
- **Interval rośnie** według formuły:
  - Repetition 0 → 1 dzień
  - Repetition 1 → 6 dni
  - Repetition > 1 → `(repetition - 1) × 6 × EaseFactor`

### 3. EaseFactor (Współczynnik Łatwości)
Formuła: `EF' = EF + (0.1 - (5 - grade) × (0.08 + (5 - grade) × 0.02))`

- **Min**: 1.3
- **Max**: 2.5
- **Start**: 2.5
- Grade 5 → EF rośnie (+0.1)
- Grade 4 → EF lekko rośnie (+0.02)
- Grade 3 → EF lekko maleje (-0.14)
- Grade 0-2 → EF znacznie maleje

## Przykłady Rzeczywiste

### Przykład 1: Perfekcyjna Nauka (tylko Grade 5)

**Nowa flashcard**
```
Stan początkowy:
- Interval: null
- Repetitions: null
- EaseFactor: null
- NextRepetitionDate: null
```

**Powtórka #1 (2026-01-01, Grade 5)**
```
Obliczenia:
- EF: null → 2.5 (default)
- EF': 2.5 + (0.1 - 0) = 2.5 (max)
- Repetitions: 0 → 1
- Interval: 1 dzień

Wynik:
- Interval: 1
- Repetitions: 1
- EaseFactor: 2.5
- NextRepetitionDate: 2026-01-02
```

**Powtórka #2 (2026-01-02, Grade 5)**
```
Obliczenia:
- EF': 2.5 + 0.1 = 2.5 (max)
- Repetitions: 1 → 2
- Interval: 6 dni

Wynik:
- Interval: 6
- Repetitions: 2
- EaseFactor: 2.5
- NextRepetitionDate: 2026-01-08
```

**Powtórka #3 (2026-01-08, Grade 5)**
```
Obliczenia:
- EF': 2.5 (max)
- Repetitions: 2 → 3
- Interval: (3-1) × 6 × 2.5 = 2 × 6 × 2.5 = 30 dni

Wynik:
- Interval: 30
- Repetitions: 3
- EaseFactor: 2.5
- NextRepetitionDate: 2026-02-07
```

**Powtórka #4 (2026-02-07, Grade 5)**
```
Obliczenia:
- Repetitions: 3 → 4
- Interval: (4-1) × 6 × 2.5 = 45 dni

Wynik:
- Interval: 45
- Repetitions: 4
- EaseFactor: 2.5
- NextRepetitionDate: 2026-03-24
```

### Przykład 2: Nauka z Wahaniami

**Nowa flashcard**

**Powtórka #1 (2026-01-01, Grade 4 - hesitation)**
```
Obliczenia:
- EF: 2.5 (default)
- EF': 2.5 + (0.1 - 1 × 0.1) = 2.5 + 0.02 = 2.5 (max)
- Repetitions: 0 → 1
- Interval: 1 dzień

Wynik:
- Interval: 1
- Repetitions: 1
- EaseFactor: 2.5
- NextRepetitionDate: 2026-01-02
```

**Powtórka #2 (2026-01-02, Grade 3 - difficulty)**
```
Obliczenia:
- EF': 2.5 + (0.1 - 2 × 0.12) = 2.5 - 0.14 = 2.36
- Repetitions: 1 → 2
- Interval: 6 dni

Wynik:
- Interval: 6
- Repetitions: 2
- EaseFactor: 2.36
- NextRepetitionDate: 2026-01-08
```

**Powtórka #3 (2026-01-08, Grade 5)**
```
Obliczenia:
- EF': 2.36 + 0.1 = 2.46
- Repetitions: 2 → 3
- Interval: (3-1) × 6 × 2.46 = 29.52 → 30 dni

Wynik:
- Interval: 30
- Repetitions: 3
- EaseFactor: 2.46
- NextRepetitionDate: 2026-02-07
```

### Przykład 3: Zapomnienie i Reset

**Stan przed zapomnieniem**
```
- Interval: 30
- Repetitions: 3
- EaseFactor: 2.5
- NextRepetitionDate: 2026-02-07
```

**Powtórka (2026-02-10, Grade 1 - incorrect but familiar)**
```
Obliczenia:
- EF': 2.5 + (0.1 - 4 × 0.16) = 2.5 - 0.54 = 1.96
- Repetitions: 3 → 0 (RESET!)
- Interval: 1 dzień

Wynik:
- Interval: 1
- Repetitions: 0
- EaseFactor: 1.96 (obniżony)
- NextRepetitionDate: 2026-02-11
```

**Nauka od nowa (2026-02-11, Grade 4)**
```
Obliczenia:
- EF': 1.96 + 0.02 = 1.98
- Repetitions: 0 → 1
- Interval: 1 dzień

Wynik:
- Interval: 1
- Repetitions: 1
- EaseFactor: 1.98
- NextRepetitionDate: 2026-02-12
```

**Kolejna powtórka (2026-02-12, Grade 5)**
```
Obliczenia:
- EF': 1.98 + 0.1 = 2.08
- Repetitions: 1 → 2
- Interval: 6 dni

Wynik:
- Interval: 6
- Repetitions: 2
- EaseFactor: 2.08
- NextRepetitionDate: 2026-02-18
```

### Przykład 4: Trudna Flashcard (niskie EaseFactor)

**Powtórka #1 (Grade 3)**
```
EF: 2.5 → 2.36
Interval: 1 dzień
Repetitions: 1
```

**Powtórka #2 (Grade 3)**
```
EF: 2.36 → 2.22
Interval: 6 dni
Repetitions: 2
```

**Powtórka #3 (Grade 3)**
```
EF: 2.22 → 2.08
Interval: (3-1) × 6 × 2.08 = 24.96 → 25 dni
Repetitions: 3
```

**Powtórka #4 (Grade 2 - incorrect)**
```
EF: 2.08 → 1.54
Interval: 1 dzień (RESET)
Repetitions: 0
```

**Powtórka #5 (Grade 4)**
```
EF: 1.54 → 1.56
Interval: 1 dzień
Repetitions: 1
```

**Powtórka #6 (Grade 4)**
```
EF: 1.56 → 1.58
Interval: 6 dni
Repetitions: 2
```

**Powtórka #7 (Grade 4)**
```
EF: 1.58 → 1.60
Interval: (3-1) × 6 × 1.60 = 19.2 → 19 dni
Repetitions: 3
```

## Porównanie Różnych Strategii

### Strategia A: Zawsze Grade 5
```
Powtórka 1: 1 dzień   → 2 stycznia
Powtórka 2: 6 dni     → 8 stycznia
Powtórka 3: 30 dni    → 7 lutego
Powtórka 4: 45 dni    → 24 marca
Powtórka 5: 60 dni    → 23 maja
```

### Strategia B: Wahania (Grade 4-5)
```
Powtórka 1: 1 dzień   → 2 stycznia (Grade 4, EF=2.5)
Powtórka 2: 6 dni     → 8 stycznia (Grade 4, EF=2.5)
Powtórka 3: 30 dni    → 7 lutego   (Grade 5, EF=2.5)
Powtórka 4: 45 dni    → 24 marca   (Grade 4, EF=2.5)
Powtórka 5: 60 dni    → 23 maja    (Grade 5, EF=2.5)
```

### Strategia C: Trudna nauka (Grade 3-4)
```
Powtórka 1: 1 dzień   → 2 stycznia  (Grade 3, EF=2.36)
Powtórka 2: 6 dni     → 8 stycznia  (Grade 3, EF=2.22)
Powtórka 3: 26 dni    → 3 lutego    (Grade 4, EF=2.24)
Powtórka 4: 40 dni    → 15 marca    (Grade 3, EF=2.10)
Powtórka 5: 50 dni    → 4 maja      (Grade 4, EF=2.12)
```

### Strategia D: Z resetem
```
Powtórka 1: 1 dzień   → 2 stycznia  (Grade 5, EF=2.5)
Powtórka 2: 6 dni     → 8 stycznia  (Grade 5, EF=2.5)
Powtórka 3: 30 dni    → 7 lutego    (Grade 1, EF=1.96, RESET)
Powtórka 4: 1 dzień   → 8 lutego    (Grade 4, EF=1.98)
Powtórka 5: 6 dni     → 14 lutego   (Grade 5, EF=2.08)
Powtórka 6: 24 dni    → 10 marca    (Grade 5, EF=2.08)
```

## Wnioski

1. **Grade 5 = najszybszy progres**: Maksymalny EaseFactor (2.5), najdłuższe interwały
2. **Grade 3 = wolny progres**: EaseFactor maleje, interwały krósze niż przy Grade 4-5
3. **Grade 0-2 = reset**: Wrócisz do początku, ale EaseFactor "pamięta" trudność
4. **EaseFactor adaptuje się**: Flashcardy które są trudne (niskie oceny) pojawiają się częściej
5. **Minimalna częstotliwość**: Nawet przy Grade 5, interwały rosną stopniowo dla długoterminowej retencji

## Kiedy Flashcard Jest "Due" (Do Powtórki)?

Flashcard jest do powtórki gdy:
- `SRSNextRepetitionDate == null` (nowa flashcard, nigdy nie oceniana)
- `SRSNextRepetitionDate <= DateTime.UtcNow` (termin minął)

Endpoint `GET /api/learning/due` zwraca wszystkie takie flashcards, posortowane według daty (najbardziej przeterminowane pierwsze).
