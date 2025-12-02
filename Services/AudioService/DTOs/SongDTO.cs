using System.Text.Json.Serialization;

namespace AudioService.Models
{

    public class SongDTO
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
}
