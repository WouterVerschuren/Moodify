namespace PlaylistService.Models;

public class Playlist
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<Guid>? SongIds { get; set; }
}