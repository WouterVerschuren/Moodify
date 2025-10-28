using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodifyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMoodToSongs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SongMood",
                table: "Songs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SongMood",
                table: "Songs");
        }
    }
}
