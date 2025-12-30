# Database Schema - AI Flashcard Generator

## 1. Tables

### 1.1. Users

Stores user authentication data.

| Column       | Data Type     | Constraints                    | Description                          |
| ------------ | ------------- | ------------------------------ | ------------------------------------ |
| Id           | INT           | PRIMARY KEY IDENTITY(1,1)      | Unique user identifier               |
| Username     | NVARCHAR(50)  | NOT NULL, UNIQUE               | Username (case-sensitive)            |
| PasswordHash | NVARCHAR(255) | NOT NULL                       | Hashed user password                 |
| CreatedAtUtc | DATETIME2     | NOT NULL, DEFAULT GETUTCDATE() | Account creation date and time (UTC) |
| UpdatedAtUtc | DATETIME2     | NOT NULL, DEFAULT GETUTCDATE() | Last update date and time (UTC)      |

**Indexes:**

- `PK_Users` - Primary key on `Id` column
- `UQ_Users_Username` - Unique index on `Username` column (with case-sensitive option)

---

### 1.2. Flashcards

Main table storing all user flashcards.

| Column                | Data Type     | Constraints                                           | Description                                                          |
| --------------------- | ------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Id                    | INT           | PRIMARY KEY IDENTITY(1,1)                             | Unique flashcard identifier                                          |
| UserId                | INT           | NOT NULL, FOREIGN KEY REFERENCES Users(Id)            | Flashcard owner identifier                                           |
| Question              | NVARCHAR(200) | NOT NULL                                              | Question on the flashcard                                            |
| Answer                | NVARCHAR(500) | NOT NULL                                              | Answer on the flashcard                                              |
| Source                | INT           | NOT NULL, DEFAULT 1, CHECK (Source IN (0, 1))         | Flashcard origin source (0=AI, 1=Manual)                             |
| Status                | INT           | NOT NULL, DEFAULT 0, CHECK (Status IN (0, 1, 2, 3))   | Flashcard status (0=Not applicable, 1=Accepted, 2=Edited, 3=Deleted) |
| SRSInterval           | INT           | NULL                                                  | Repetition interval in days (SRS algorithm)                          |
| SRSRepetitions        | INT           | NULL, DEFAULT 0                                       | Number of repetitions performed                                      |
| SRSEaseFactor         | DECIMAL(4,2)  | NULL, DEFAULT 2.5                                     | Ease factor (SRS algorithm)                                          |
| SRSNextRepetitionDate | DATETIME2     | NULL                                                  | Next scheduled repetition date                                       |
| SRSLastGrade          | INT           | NULL, CHECK (SRSLastGrade >= 0 AND SRSLastGrade <= 5) | Last flashcard grade (0-5)                                           |
| CreatedAtUtc          | DATETIME2     | NOT NULL, DEFAULT GETUTCDATE()                        | Flashcard creation date and time (UTC)                               |
| UpdatedAtUtc          | DATETIME2     | NOT NULL, DEFAULT GETUTCDATE()                        | Last update date and time (UTC)                                      |

**Indexes:**

- `PK_Flashcards` - Primary key on `Id` column
- `IX_Flashcards_UserId` - Non-clustered index on `UserId` column
- `IX_Flashcards_SRSNextRepetitionDate` - Non-clustered index on `SRSNextRepetitionDate` column
- `IX_Flashcards_UserId_Status` - Composite index on `UserId`, `Status` columns (active flashcards query optimization)

---

### 1.3. FlashcardGenerationEvents

Table for logging AI flashcard generation metrics.

| Column          | Data Type | Constraints                                | Description                                   |
| --------------- | --------- | ------------------------------------------ | --------------------------------------------- |
| Id              | INT       | PRIMARY KEY IDENTITY(1,1)                  | Unique event identifier                       |
| UserId          | INT       | NOT NULL, FOREIGN KEY REFERENCES Users(Id) | User identifier                               |
| GeneratedAtUtc  | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE()             | Flashcard generation date and time (UTC)      |
| CandidatesCount | INT       | NOT NULL                                   | Number of generated flashcard candidates      |
| AcceptedCount   | INT       | NOT NULL, DEFAULT 0                        | Number of flashcards accepted without editing |
| EditedCount     | INT       | NOT NULL, DEFAULT 0                        | Number of flashcards accepted after editing   |
| CreatedAtUtc    | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE()             | Record creation date and time (UTC)           |
| UpdatedAtUtc    | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE()             | Last update date and time (UTC)               |

**Indexes:**

- `PK_FlashcardGenerationEvents` - Primary key on `Id` column
- `IX_FlashcardGenerationEvents_UserId` - Non-clustered index on `UserId` column

---

### 1.4. Logs

Technical table for storing application error logs, managed by the Serilog library.

The structure will be automatically created by Serilog.Sinks.MSSqlServer according to the library's standard schema. Minimum structure includes:

| Column          | Data Type     | Description                                       |
| --------------- | ------------- | ------------------------------------------------- |
| Id              | INT           | Unique log entry identifier                       |
| Message         | NVARCHAR(MAX) | Log message                                       |
| MessageTemplate | NVARCHAR(MAX) | Message template                                  |
| Level           | NVARCHAR(128) | Logging level (Error, Warning, Information, etc.) |
| TimeStamp       | DATETIME2     | Event time                                        |
| Exception       | NVARCHAR(MAX) | Exception details (if any)                        |
| Properties      | NVARCHAR(MAX) | Additional properties in XML/JSON format          |

**Note:** The exact structure of the Logs table will be defined by Serilog configuration in the backend application.

---

## 2. Table Relationships

### 2.1. Users → Flashcards

- **Relationship Type:** One-to-Many (1:N)
- **Description:** Each user can own many flashcards, but each flashcard belongs to exactly one user.
- **Foreign Key:** `Flashcards.UserId` → `Users.Id`
- **CASCADE Action:** ON DELETE CASCADE - deleting a user will delete all their flashcards (not planned for MVP)

### 2.2. Users → FlashcardGenerationEvents

- **Relationship Type:** One-to-Many (1:N)
- **Description:** Each user can have many flashcard generation events, but each event belongs to exactly one user.
- **Foreign Key:** `FlashcardGenerationEvents.UserId` → `Users.Id`
- **CASCADE Action:** ON DELETE CASCADE - deleting a user will delete all their metrics (not planned for MVP)

---

## 3. Indexes

### 3.1. Primary Indexes (PRIMARY KEY)

- `PK_Users` - Clustered on `Users.Id`
- `PK_Flashcards` - Clustered on `Flashcards.Id`
- `PK_FlashcardGenerationEvents` - Clustered on `FlashcardGenerationEvents.Id`

### 3.2. Unique Indexes (UNIQUE)

- `UQ_Users_Username` - Unique index on `Users.Username`
  - **Collation:** Case-sensitive collation should be used (e.g., `SQL_Latin1_General_CP1_CS_AS`) to ensure username case-sensitivity

### 3.3. Performance Indexes (NONCLUSTERED)

#### Flashcards Table:

- `IX_Flashcards_UserId` - Query optimization for filtering by owner
- `IX_Flashcards_SRSNextRepetitionDate` - Query optimization for learning sessions (flashcards due for review)
- `IX_Flashcards_UserId_Status` - Composite index for quickly retrieving user's active flashcards

#### FlashcardGenerationEvents Table:

- `IX_FlashcardGenerationEvents_UserId` - Query optimization for user metrics analysis

---

## 4. Constraints and Business Rules

### 4.1. Check Constraints

- `CK_Flashcards_Source` - `Source` column can only accept numeric values: 0 (AI), 1 (Manual)
- `CK_Flashcards_Status` - `Status` column can only accept numeric values: 0 (Not applicable), 1 (Accepted), 2 (Edited), 3 (Deleted)
- `CK_Flashcards_SRSLastGrade` - `SRSLastGrade` column can only accept values from 0 to 5 (inclusive)

### 4.2. Default Values

- All `CreatedAtUtc` and `UpdatedAtUtc` columns have default value `GETUTCDATE()`
- `Flashcards.Source` - DEFAULT 1 (Manual - for manually created flashcards)
- `Flashcards.Status` - DEFAULT 0 (Not applicable)
- `Flashcards.SRSRepetitions` - DEFAULT 0
- `Flashcards.SRSEaseFactor` - DEFAULT 2.5 (standard initial value for SM-2 algorithm)
- `FlashcardGenerationEvents.AcceptedCount` - DEFAULT 0
- `FlashcardGenerationEvents.EditedCount` - DEFAULT 0

### 4.3. Foreign Key Constraints

- `FK_Flashcards_UserId` - Foreign key from `Flashcards.UserId` to `Users.Id` with ON DELETE CASCADE
- `FK_FlashcardGenerationEvents_UserId` - Foreign key from `FlashcardGenerationEvents.UserId` to `Users.Id` with ON DELETE CASCADE

---

## 5. Additional Notes and Design Decisions

### 5.1. Time Zone Handling

All columns storing date and time use the `DATETIME2` type and store values in UTC. Conversion to the user's local time zone will be performed at the frontend application level.

### 5.2. Soft Delete

User flashcards are not physically deleted from the database. Instead, the `Flashcards.Status` column is changed to 3 (Deleted). This enables potential data restoration in the future and maintains metric integrity.

### 5.3. User Data Isolation

All queries retrieving flashcard data must be filtered by `UserId` of the logged-in user at the backend application level to ensure complete data isolation between users.

### 5.4. Case-Sensitivity for Username

The `Users` table requires an index on the `Username` column with case-sensitive collation. This should be configured during index creation:

```sql
CREATE UNIQUE INDEX UQ_Users_Username
ON Users(Username)
WHERE Username IS NOT NULL
COLLATE SQL_Latin1_General_CP1_CS_AS;
```

### 5.5. Spaced Repetition System (SRS) Algorithm

The schema contains a complete set of columns necessary for supporting the spaced repetition algorithm (e.g., SM-2):

- `SRSInterval` - stores the calculated interval between repetitions
- `SRSRepetitions` - counter of performed repetitions
- `SRSEaseFactor` - ease factor used by the algorithm to adjust intervals
- `SRSNextRepetitionDate` - next scheduled repetition date (used to select flashcards in learning session)
- `SRSLastGrade` - last user grade (0-5), used to recalibrate the algorithm

### 5.6. AI Metrics and Analytics

The `FlashcardGenerationEvents` table is designed to support success metrics defined in the PRD:

- **AI Acceptance Rate** - calculated as `AcceptedCount / CandidatesCount`

### 5.7. Audit Trail

`CreatedAtUtc` and `UpdatedAtUtc` columns provide basic audit trail for all key business tables. The `UpdatedAtUtc` column is automatically updated via SQL trigger with each record modification.

### 5.8. Text Field Lengths

- `Username` - NVARCHAR(50) - sufficient length for usernames
- `PasswordHash` - NVARCHAR(255) - sufficient for popular hashing algorithms (bcrypt, SHA-256)
- `Question` - NVARCHAR(200) - as per planning session notes requirements
- `Answer` - NVARCHAR(500) - as per planning session notes requirements

### 5.9. Normalization

The schema is normalized to 3NF (Third Normal Form):

- No repeating data groups
- All attributes depend on the entire primary key
- No transitive dependencies between non-key attributes

### 5.10. Scalability

For MVP, `INT` primary keys are assumed (range up to ~2.1 billion records). In case of future growth, migration to `BIGINT` can be considered for high-turnover tables (e.g., `Flashcards`, `FlashcardGenerationEvents`).

### 5.11. Query Performance

Indexes are designed with the most common operations in mind:

- Retrieving all active user flashcards
- Retrieving flashcards for review based on `SRSNextRepetitionDate`
- Aggregating AI generation metrics for user

### 5.12. Migrations and Versioning

The schema should be implemented using Entity Framework Core migrations, which ensures:

- Schema change versioning
- Rollback capability
- Automatic change application in different environments (dev, staging, production)

---

## 6. Implementation Recommendations

1. **Triggers for UpdatedAtUtc:** Create SQL triggers that automatically update the `UpdatedAtUtc` column with each UPDATE operation on `Users`, `Flashcards`, and `FlashcardGenerationEvents` tables. Example trigger implementation:

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

2. **Partitioning:** In case of very large numbers of flashcards or events, consider partitioning `Flashcards` and `FlashcardGenerationEvents` tables by `UserId` or time dates for performance improvement.

3. **Log Archiving:** The `Logs` table can grow quickly. It's recommended to implement an archiving policy (e.g., moving old logs to archive table or deletion after a specified time).

4. **Backup and Recovery:** Ensure that the backup strategy covers all tables, especially `Users` and `Flashcards`, which contain critical user data.

5. **Performance Monitoring:** Regularly monitor query performance and index usage statistics to identify potential bottlenecks.
