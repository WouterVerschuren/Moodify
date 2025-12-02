using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace PlaylistService.Models
{
    public class CreatePlaylistForm
    {
        [Required]
        public string Name { get; set; } = "";

        public string? Description { get; set; }

        public List<Guid> SongIds { get; set; } = new();
    }
}
