using Microsoft.AspNetCore.Mvc;
using PlaylistService.Models;
using PlaylistService.Services;

namespace PlaylistService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistController : ControllerBase
{
    private readonly IPlaylistSupabaseService _supabaseService;

    public PlaylistController(IPlaylistSupabaseService supabaseService)
    {
        _supabaseService = supabaseService;
    }

    [HttpGet("health")]
    public IActionResult HealthCheck() => Ok(new { status = "Healthy" });

    [HttpGet("batch")]
    public async Task<IActionResult> GetBatch([FromQuery] string ids)
    {
        if (string.IsNullOrEmpty(ids))
            return BadRequest("No playlist IDs provided.");
    
        var idList = ids.Split(',')
            .Select(id => Guid.TryParse(id, out var parsed) ? parsed : Guid.Empty)
            .Where(g => g != Guid.Empty)
            .ToList();
    
        if (!idList.Any())
            return BadRequest("No valid playlist IDs provided.");
    
        var playlists = await _supabaseService.GetPlaylistsByIdsAsync(idList);
        return Ok(playlists);
    }



    [HttpPost("create")]
    public async Task<IActionResult> CreatePlaylist([FromBody] CreatePlaylistDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Playlist name is required.");

        var playlist = await _supabaseService.CreatePlaylistAsync(dto.Name, dto.Description);

        if (dto.SongIds != null && dto.SongIds.Any())
        {
            await _supabaseService.AddSongsToPlaylistAsync(playlist.Id, dto.SongIds);
        }

        return Ok(playlist);
    }

   


    [HttpPost("{playlistId}/add-songs")]
    public async Task<IActionResult> AddSongsToPlaylist(Guid playlistId, [FromBody] List<Guid> songIds)
    {
        if (songIds == null || !songIds.Any())
            return BadRequest("No songs provided.");

        await _supabaseService.AddSongsToPlaylistAsync(playlistId, songIds);
        return Ok(new { Message = "Songs added successfully." });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPlaylist(Guid id)
    {
        var playlist = await _supabaseService.GetPlaylistAsync(id);
        if (playlist == null) return NotFound();

        playlist.SongIds = await _supabaseService.GetSongIdsAsync(id);
        return Ok(playlist);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllPlaylists()
    {
        var playlists = await _supabaseService.GetAllPlaylistsAsync();

        foreach (var playlist in playlists)
        {
            playlist.SongIds = await _supabaseService.GetSongIdsAsync(playlist.Id);
        }

        return Ok(playlists);
    }

    [HttpDelete("{playlistId}/remove-song/{songId}")]
    public async Task<IActionResult> RemoveSongFromPlaylist(Guid playlistId, Guid songId)
    {
        await _supabaseService.RemoveSongFromPlaylistAsync(playlistId, songId);
        return Ok(new { Message = "Song removed successfully." });
    }

    [HttpDelete("{playlistId}/delete")]
    public async Task<IActionResult> DeletePlaylist(Guid playlistId)
    {    
        await _supabaseService.DeletePlaylistAsync(playlistId);
    
        return Ok(new { Message = "Playlist deleted successfully." });
    }

}
