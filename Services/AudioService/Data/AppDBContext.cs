using Microsoft.EntityFrameworkCore;
using MoodifyAPI.Models;

namespace MoodifyAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Song> Songs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Convert Mood enum to string in DB
            modelBuilder.Entity<Song>()
                .Property(s => s.SongMood)
                .HasConversion<string>();

            base.OnModelCreating(modelBuilder);
        }
    }
}
