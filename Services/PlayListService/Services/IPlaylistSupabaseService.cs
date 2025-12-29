using PlaylistService.Models;

namespace PlaylistService.Services;

public interface IPlaylistSupabaseService
{
    Task<List<Playlist>> GetPlaylistsByIdsAsync(List<Guid> playlistIds);
    Task<Playlist> CreatePlaylistAsync(string name, string? description);
    Task AddSongsToPlaylistAsync(Guid playlistId, List<Guid> songIds);
    Task RemoveSongFromPlaylistAsync(Guid playlistId, Guid songId);
    Task<Playlist?> GetPlaylistAsync(Guid playlistId);
    Task DeletePlaylistAsync(Guid playlistId);
    Task<List<Guid>> GetSongIdsAsync(Guid playlistId);
    Task<List<Playlist>> GetAllPlaylistsAsync();
    Task RemoveSongFromAllPlaylistsAsync(Guid songId);
    
}
