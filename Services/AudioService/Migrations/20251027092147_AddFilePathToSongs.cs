using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoodifyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddFilePathToSongs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileData",
                table: "Songs");

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "Songs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "Songs");

            migrationBuilder.AddColumn<byte[]>(
                name: "FileData",
                table: "Songs",
                type: "bytea",
                nullable: true);
        }
    }
}
