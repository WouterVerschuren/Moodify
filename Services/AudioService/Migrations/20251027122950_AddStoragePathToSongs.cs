using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodifyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddStoragePathToSongs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FilePath",
                table: "Songs",
                newName: "StoragePath");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StoragePath",
                table: "Songs",
                newName: "FilePath");
        }
    }
}
