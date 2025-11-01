namespace AudioService.Models
{
    public class UploadSongForm
    {
        public IFormFile File { get; set; } = null!;
        public string Title { get; set; } = "";
        public string Artist { get; set; } = "";
        public Mood SongMood { get; set; } = Mood.Chill;
    }
}
