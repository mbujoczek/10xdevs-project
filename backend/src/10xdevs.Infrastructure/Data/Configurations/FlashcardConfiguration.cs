using _10xdevs.Domain.Entities;
using _10xdevs.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _10xdevs.Infrastructure.Data.Configurations;

public class FlashcardConfiguration : IEntityTypeConfiguration<Flashcard>
{
    public void Configure(EntityTypeBuilder<Flashcard> builder)
    {
        // Table name with check constraints and trigger declaration
        builder.ToTable("Flashcards", t =>
        {
            t.HasCheckConstraint("CK_Flashcards_Source", "[Source] IN (0, 1)");
            t.HasCheckConstraint("CK_Flashcards_Status", "[Status] IN (0, 1, 2, 3)");
            t.HasCheckConstraint("CK_Flashcards_SRSLastGrade", "[SRSLastGrade] IS NULL OR ([SRSLastGrade] >= 0 AND [SRSLastGrade] <= 5)");
            t.HasTrigger("TR_Flashcards_UpdatedAtUtc");
        });

        // Primary key
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id)
            .ValueGeneratedOnAdd();

        // UserId - foreign key
        builder.Property(f => f.UserId)
            .IsRequired();

        // Question
        builder.Property(f => f.Question)
            .IsRequired()
            .HasMaxLength(200);

        // Answer
        builder.Property(f => f.Answer)
            .IsRequired()
            .HasMaxLength(500);

        // Source - stored as INT
        builder.Property(f => f.Source)
            .IsRequired()
            .HasDefaultValue(FlashcardSource.Manual)
            .HasConversion<int>();

        // Status - stored as INT
        builder.Property(f => f.Status)
            .IsRequired()
            .HasDefaultValue(FlashcardStatus.NotApplicable)
            .HasConversion<int>();

        // SRS columns
        builder.Property(f => f.SRSInterval)
            .IsRequired(false);

        builder.Property(f => f.SRSRepetitions)
            .IsRequired(false)
            .HasDefaultValue(0);

        builder.Property(f => f.SRSEaseFactor)
            .IsRequired(false)
            .HasDefaultValue(2.5m)
            .HasPrecision(4, 2);

        builder.Property(f => f.SRSNextRepetitionDate)
            .IsRequired(false);

        builder.Property(f => f.SRSLastGrade)
            .IsRequired(false)
            .HasConversion<int>();

        // Audit columns
        builder.Property(f => f.CreatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(f => f.UpdatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(f => f.UserId)
            .HasDatabaseName("IX_Flashcards_UserId");

        builder.HasIndex(f => f.SRSNextRepetitionDate)
            .HasDatabaseName("IX_Flashcards_SRSNextRepetitionDate");

        builder.HasIndex(f => new { f.UserId, f.Status })
            .HasDatabaseName("IX_Flashcards_UserId_Status");

        // Relationships configured in UserConfiguration
    }
}
