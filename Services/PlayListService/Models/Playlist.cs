namespace PlaylistService.Models;

public class Playlist
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<SongDto>? Songs { get; set; }
}