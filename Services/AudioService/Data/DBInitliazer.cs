using MoodifyAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MoodifyAPI.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.Migrate();

            if (context.Songs.Any()) return;

        

            context.SaveChanges();
        }
    }
}