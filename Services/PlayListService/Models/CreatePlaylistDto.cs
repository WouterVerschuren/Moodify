namespace PlaylistService.Models;
public class CreatePlaylistDto
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<Guid> SongIds { get; set; } = new();
}