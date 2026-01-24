using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _10xdevs.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, collation: "SQL_Latin1_General_CP1_CS_AS"),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FlashcardGenerationEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CandidatesCount = table.Column<int>(type: "int", nullable: false),
                    AcceptedCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    EditedCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlashcardGenerationEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlashcardGenerationEvents_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Flashcards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Question = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Answer = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Source = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    Status = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    SRSInterval = table.Column<int>(type: "int", nullable: true),
                    SRSRepetitions = table.Column<int>(type: "int", nullable: true, defaultValue: 0),
                    SRSEaseFactor = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: true, defaultValue: 2.5m),
                    SRSNextRepetitionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SRSLastGrade = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Flashcards", x => x.Id);
                    table.CheckConstraint("CK_Flashcards_Source", "[Source] IN (0, 1)");
                    table.CheckConstraint("CK_Flashcards_SRSLastGrade", "[SRSLastGrade] IS NULL OR ([SRSLastGrade] >= 0 AND [SRSLastGrade] <= 5)");
                    table.CheckConstraint("CK_Flashcards_Status", "[Status] IN (0, 1, 2, 3)");
                    table.ForeignKey(
                        name: "FK_Flashcards_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FlashcardGenerationEvents_UserId",
                table: "FlashcardGenerationEvents",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Flashcards_SRSNextRepetitionDate",
                table: "Flashcards",
                column: "SRSNextRepetitionDate");

            migrationBuilder.CreateIndex(
                name: "IX_Flashcards_UserId",
                table: "Flashcards",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Flashcards_UserId_Status",
                table: "Flashcards",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "UQ_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            // Create triggers for automatic UpdatedAtUtc updates
            migrationBuilder.Sql(@"
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
            ");

            migrationBuilder.Sql(@"
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
            ");

            migrationBuilder.Sql(@"
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
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop triggers
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS TR_Users_UpdatedAtUtc;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS TR_Flashcards_UpdatedAtUtc;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS TR_FlashcardGenerationEvents_UpdatedAtUtc;");

            migrationBuilder.DropTable(
                name: "FlashcardGenerationEvents");

            migrationBuilder.DropTable(
                name: "Flashcards");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
