using _10xdevs.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _10xdevs.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // Table name with trigger declaration
        builder.ToTable("Users", tb =>
        {
            tb.HasTrigger("TR_Users_UpdatedAtUtc");
        });

        // Primary key
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id)
            .ValueGeneratedOnAdd();

        // Username - unique, case-sensitive
        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(50)
            .UseCollation("SQL_Latin1_General_CP1_CS_AS"); // Case-sensitive collation

        builder.HasIndex(u => u.Username)
            .IsUnique()
            .HasDatabaseName("UQ_Users_Username");

        // PasswordHash
        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(255);

        // Audit columns
        builder.Property(u => u.CreatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(u => u.UpdatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Relationships
        builder.HasMany(u => u.Flashcards)
            .WithOne(f => f.User)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_Flashcards_UserId");

        builder.HasMany(u => u.FlashcardGenerationEvents)
            .WithOne(e => e.User)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_FlashcardGenerationEvents_UserId");
    }
}
