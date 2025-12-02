namespace PlaylistService.Models;

public class SongDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string StoragePath { get; set; } = "";
}