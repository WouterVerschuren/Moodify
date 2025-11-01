using System.Text.Json.Serialization;

namespace AudioService.Models
{
   public enum Mood
{
    Happy,
    Sad,
    Chill,
    Energetic,
    Romantic,
}


    public class Song
    {
        public int Id { get; set; } 
        public string Title { get; set; } = "";
        public string Artist { get; set; } = "";
        public string SongMood { get; set; } = "Chill";
        public string StoragePath { get; set; } = "";
        public string ContentType { get; set; } = "audio/mpeg";

        [JsonIgnore]
        public string? SignedUrl { get; set; }
    }
}
