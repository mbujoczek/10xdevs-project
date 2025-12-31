using _10xdevs.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _10xdevs.Infrastructure.Data.Configurations;

public class FlashcardGenerationEventConfiguration : IEntityTypeConfiguration<FlashcardGenerationEvent>
{
    public void Configure(EntityTypeBuilder<FlashcardGenerationEvent> builder)
    {
        // Table name with trigger declaration
        builder.ToTable("FlashcardGenerationEvents", tb =>
        {
            tb.HasTrigger("TR_FlashcardGenerationEvents_UpdatedAtUtc");
        });

        // Primary key
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .ValueGeneratedOnAdd();

        // UserId - foreign key
        builder.Property(e => e.UserId)
            .IsRequired();

        // Metrics columns
        builder.Property(e => e.CandidatesCount)
            .IsRequired();

        builder.Property(e => e.AcceptedCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(e => e.EditedCount)
            .IsRequired()
            .HasDefaultValue(0);

        // Audit columns
        builder.Property(e => e.CreatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(e => e.UpdatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(e => e.UserId)
            .HasDatabaseName("IX_FlashcardGenerationEvents_UserId");

        // Relationships configured in UserConfiguration
    }
}
