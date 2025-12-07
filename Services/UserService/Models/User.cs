using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization; 

namespace UserService.Models
{
    public class User
    {
        [Key]
        public Guid id { get; set; }

        [Required]
        [MaxLength(20)]
        public string Username { get; set; } = null!;

        [Required]
        [EmailAddress]
        [MaxLength(50)]
        public string Email { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string PasswordHash { get; set; } = null!;

        public List<Song> Songs { get; set; } = new();
        public List<Playlist> Playlists { get; set; } = new();
    }

    public class Song
    {
        public Guid Id { get; set; } 
        public string Title { get; set; } = "";
        public string Artist { get; set; } = "";
        public string SongMood { get; set; } = "Chill";
        public string StoragePath { get; set; } = "";
        public string ContentType { get; set; } = "audio/mpeg";

        [JsonIgnore]
        public string? SignedUrl { get; set; }
    }

    public class Playlist
    {
       public Guid Id { get; set; }
       public string Name { get; set; } = "";
       public string? Description { get; set; }
       public List<Song>? Songs { get; set; }
    }
}
