# Spaced Repetition Mechanism - SM-2 Algorithm (SuperMemo 2)

## Overview

The system uses the SM-2 algorithm to optimize flashcard repetition intervals. The better you know the material, the less frequently the flashcard appears. The worse - the more often you need to repeat it.

## Grade Scale (SRSGrade)

| Grade | Name                      | Description                                             |
| ----- | ------------------------- | ------------------------------------------------------- |
| 0     | CompleteBlackout          | Complete forgetting - no recall                         |
| 1     | IncorrectResponse         | Incorrect answer, but correct answer seemed familiar    |
| 2     | IncorrectResponseRecalled | Incorrect answer, but correct answer was easy to recall |
| 3     | CorrectWithDifficulty     | Correct answer after significant effort                 |
| 4     | CorrectAfterHesitation    | Correct answer with hesitation                          |
| 5     | PerfectResponse           | Perfect answer - immediate recall                       |

## SRS Parameters

- **SRSInterval**: Number of days until next repetition
- **SRSRepetitions**: Number of successful repetitions (grade ≥ 3)
- **SRSEaseFactor**: Ease factor (1.3 - 2.5), default 2.5
- **SRSNextRepetitionDate**: Date of next scheduled repetition
- **SRSLastGrade**: Last assigned grade

## Key Rules

### 1. Grades 0-2 (Failure)

- **Reset progress**: Repetitions → 0
- **Next interval**: 1 day
- **EaseFactor**: Gets updated (usually decreases)

### 2. Grades 3-5 (Success)

- **Increase repetitions**: +1
- **Interval grows** according to formula:
  - Repetition 0 → 1 day
  - Repetition 1 → 6 days
  - Repetition > 1 → `(repetition - 1) × 6 × EaseFactor`

### 3. EaseFactor (Ease Coefficient)

Formula: `EF' = EF + (0.1 - (5 - grade) × (0.08 + (5 - grade) × 0.02))`

- **Min**: 1.3
- **Max**: 2.5
- **Start**: 2.5
- Grade 5 → EF increases (+0.1)
- Grade 4 → EF slightly increases (+0.02)
- Grade 3 → EF slightly decreases (-0.14)
- Grade 0-2 → EF significantly decreases

## Real-World Examples

### Example 1: Perfect Learning (only Grade 5)

**New flashcard**

```
Initial state:
- Interval: null
- Repetitions: null
- EaseFactor: null
- NextRepetitionDate: null
```

**Repetition #1 (2026-01-01, Grade 5)**

```
Calculations:
- EF: null → 2.5 (default)
- EF': 2.5 + (0.1 - 0) = 2.5 (max)
- Repetitions: 0 → 1
- Interval: 1 day

Result:
- Interval: 1
- Repetitions: 1
- EaseFactor: 2.5
- NextRepetitionDate: 2026-01-02
```

**Repetition #2 (2026-01-02, Grade 5)**

```
Calculations:
- EF': 2.5 + 0.1 = 2.5 (max)
- Repetitions: 1 → 2
- Interval: 6 days

Result:
- Interval: 6
- Repetitions: 2
- EaseFactor: 2.5
- NextRepetitionDate: 2026-01-08
```

**Repetition #3 (2026-01-08, Grade 5)**

```
Calculations:
- EF': 2.5 (max)
- Repetitions: 2 → 3
- Interval: (3-1) × 6 × 2.5 = 2 × 6 × 2.5 = 30 days

Result:
- Interval: 30
- Repetitions: 3
- EaseFactor: 2.5
- NextRepetitionDate: 2026-02-07
```

**Repetition #4 (2026-02-07, Grade 5)**

```
Calculations:
- Repetitions: 3 → 4
- Interval: (4-1) × 6 × 2.5 = 45 days

Result:
- Interval: 45
- Repetitions: 4
- EaseFactor: 2.5
- NextRepetitionDate: 2026-03-24
```

### Example 2: Learning with Fluctuations

**New flashcard**

**Repetition #1 (2026-01-01, Grade 4 - hesitation)**

```
Calculations:
- EF: 2.5 (default)
- EF': 2.5 + (0.1 - 1 × 0.1) = 2.5 + 0.02 = 2.5 (max)
- Repetitions: 0 → 1
- Interval: 1 day

Result:
- Interval: 1
- Repetitions: 1
- EaseFactor: 2.5
- NextRepetitionDate: 2026-01-02
```

**Repetition #2 (2026-01-02, Grade 3 - difficulty)**

```
Calculations:
- EF': 2.5 + (0.1 - 2 × 0.12) = 2.5 - 0.14 = 2.36
- Repetitions: 1 → 2
- Interval: 6 days

Result:
- Interval: 6
- Repetitions: 2
- EaseFactor: 2.36
- NextRepetitionDate: 2026-01-08
```

**Repetition #3 (2026-01-08, Grade 5)**

```
Calculations:
- EF': 2.36 + 0.1 = 2.46
- Repetitions: 2 → 3
- Interval: (3-1) × 6 × 2.46 = 29.52 → 30 days

Result:
- Interval: 30
- Repetitions: 3
- EaseFactor: 2.46
- NextRepetitionDate: 2026-02-07
```

### Example 3: Forgetting and Reset

**State before forgetting**

```
- Interval: 30
- Repetitions: 3
- EaseFactor: 2.5
- NextRepetitionDate: 2026-02-07
```

**Repetition (2026-02-10, Grade 1 - incorrect but familiar)**

```
Calculations:
- EF': 2.5 + (0.1 - 4 × 0.16) = 2.5 - 0.54 = 1.96
- Repetitions: 3 → 0 (RESET!)
- Interval: 1 day

Result:
- Interval: 1
- Repetitions: 0
- EaseFactor: 1.96 (reduced)
- NextRepetitionDate: 2026-02-11
```

**Learning from scratch (2026-02-11, Grade 4)**

```
Calculations:
- EF': 1.96 + 0.02 = 1.98
- Repetitions: 0 → 1
- Interval: 1 day

Result:
- Interval: 1
- Repetitions: 1
- EaseFactor: 1.98
- NextRepetitionDate: 2026-02-12
```

**Next repetition (2026-02-12, Grade 5)**

```
Calculations:
- EF': 1.98 + 0.1 = 2.08
- Repetitions: 1 → 2
- Interval: 6 days

Result:
- Interval: 6
- Repetitions: 2
- EaseFactor: 2.08
- NextRepetitionDate: 2026-02-18
```

### Example 4: Difficult Flashcard (low EaseFactor)

**Repetition #1 (Grade 3)**

```
EF: 2.5 → 2.36
Interval: 1 day
Repetitions: 1
```

**Repetition #2 (Grade 3)**

```
EF: 2.36 → 2.22
Interval: 6 days
Repetitions: 2
```

**Repetition #3 (Grade 3)**

```
EF: 2.22 → 2.08
Interval: (3-1) × 6 × 2.08 = 24.96 → 25 days
Repetitions: 3
```

**Repetition #4 (Grade 2 - incorrect)**

```
EF: 2.08 → 1.54
Interval: 1 day (RESET)
Repetitions: 0
```

**Repetition #5 (Grade 4)**

```
EF: 1.54 → 1.56
Interval: 1 day
Repetitions: 1
```

**Repetition #6 (Grade 4)**

```
EF: 1.56 → 1.58
Interval: 6 days
Repetitions: 2
```

**Repetition #7 (Grade 4)**

```
EF: 1.58 → 1.60
Interval: (3-1) × 6 × 1.60 = 19.2 → 19 days
Repetitions: 3
```

## Comparison of Different Strategies

### Strategy A: Always Grade 5

```
Repetition 1: 1 day    → January 2
Repetition 2: 6 days   → January 8
Repetition 3: 30 days  → February 7
Repetition 4: 45 days  → March 24
Repetition 5: 60 days  → May 23
```

### Strategy B: Fluctuations (Grade 4-5)

```
Repetition 1: 1 day    → January 2   (Grade 4, EF=2.5)
Repetition 2: 6 days   → January 8   (Grade 4, EF=2.5)
Repetition 3: 30 days  → February 7  (Grade 5, EF=2.5)
Repetition 4: 45 days  → March 24    (Grade 4, EF=2.5)
Repetition 5: 60 days  → May 23      (Grade 5, EF=2.5)
```

### Strategy C: Difficult learning (Grade 3-4)

```
Repetition 1: 1 day    → January 2   (Grade 3, EF=2.36)
Repetition 2: 6 days   → January 8   (Grade 3, EF=2.22)
Repetition 3: 26 days  → February 3  (Grade 4, EF=2.24)
Repetition 4: 40 days  → March 15    (Grade 3, EF=2.10)
Repetition 5: 50 days  → May 4       (Grade 4, EF=2.12)
```

### Strategy D: With reset

```
Repetition 1: 1 day    → January 2   (Grade 5, EF=2.5)
Repetition 2: 6 days   → January 8   (Grade 5, EF=2.5)
Repetition 3: 30 days  → February 7  (Grade 1, EF=1.96, RESET)
Repetition 4: 1 day    → February 8  (Grade 4, EF=1.98)
Repetition 5: 6 days   → February 14 (Grade 5, EF=2.08)
Repetition 6: 24 days  → March 10    (Grade 5, EF=2.08)
```

## Conclusions

1. **Grade 5 = fastest progress**: Maximum EaseFactor (2.5), longest intervals
2. **Grade 3 = slow progress**: EaseFactor decreases, intervals shorter than with Grade 4-5
3. **Grade 0-2 = reset**: You go back to the beginning, but EaseFactor "remembers" the difficulty
4. **EaseFactor adapts**: Flashcards that are difficult (low grades) appear more frequently
5. **Minimum frequency**: Even with Grade 5, intervals grow gradually for long-term retention

## When Is a Flashcard "Due" (For Review)?

A flashcard is due for review when:

- `SRSNextRepetitionDate == null` (new flashcard, never rated)
- `SRSNextRepetitionDate <= DateTime.UtcNow` (deadline has passed)

The `GET /api/learning/due` endpoint returns all such flashcards, sorted by date (most overdue first).
