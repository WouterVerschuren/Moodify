using Microsoft.AspNetCore.Mvc;
using PlaylistService.Models;
using PlaylistService.Services;
using System.Text.Json;

namespace PlaylistService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistController : ControllerBase
{
    private readonly IPlaylistSupabaseService _supabaseService;
    private readonly HttpClient _httpClient;
    private readonly string _audioServiceUrl;

    public PlaylistController(IPlaylistSupabaseService supabaseService)
    {
        _supabaseService = supabaseService;
        _httpClient = new HttpClient();
        _audioServiceUrl = Environment.GetEnvironmentVariable("AUDIO_SERVICE_URL")
                            ?? throw new Exception("AUDIO_SERVICE_URL not set");
    }

    [HttpGet("health")]
    public IActionResult Get() => Ok(new { status = "Healthy" });

    [HttpPost("create")]
    public async Task<IActionResult> CreatePlaylist([FromBody] CreatePlaylistDto dto)
    {
        var createdPlaylist = await _supabaseService.CreatePlaylistAsync(dto.Name, dto.Description);

        if (dto.SongIds != null && dto.SongIds.Any())
        {
            await _supabaseService.AddSongsToPlaylistAsync(createdPlaylist.Id, dto.SongIds);
        }

        return Ok(createdPlaylist);
    }

    [HttpPost("{playlistId}/add-songs")]
    public async Task<IActionResult> AddSongsToPlaylist(Guid playlistId, [FromBody] List<Guid> songIds)
    {
        if (songIds == null || !songIds.Any())
            return BadRequest("No songs provided.");

        try
        {
            await _supabaseService.AddSongsToPlaylistAsync(playlistId, songIds);
            return Ok(new { Message = "Songs added successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlaylist(Guid id)
    {
        var playlist = await _supabaseService.GetPlaylistAsync(id);
        if (playlist == null) return NotFound();

        var songIds = await _supabaseService.GetSongIdsAsync(id);
        if (songIds != null && songIds.Any())
        {
            var idsParam = string.Join(",", songIds);
            var response = await _httpClient.GetAsync($"{_audioServiceUrl}/api/audio/batch?ids={idsParam}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var songs = JsonSerializer.Deserialize<List<SongDto>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<SongDto>();

            playlist.Songs = songs;
        }

        return Ok(playlist);
    }
    
    [HttpGet("all")]
    public async Task<IActionResult> GetAllPlaylists()
    {
        var playlists = await _supabaseService.GetAllPlaylistsAsync();
    
        foreach (var playlist in playlists)
        {
            var songIds = await _supabaseService.GetSongIdsAsync(playlist.Id);
    
            if (songIds != null && songIds.Any())
            {
                var idsParam = string.Join(",", songIds);
                var response = await _httpClient.GetAsync($"{_audioServiceUrl}/api/audio/batch?ids={idsParam}");
                response.EnsureSuccessStatusCode();
    
                var json = await response.Content.ReadAsStringAsync();
                var songs = JsonSerializer.Deserialize<List<SongDto>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<SongDto>();
    
                playlist.Songs = songs;
            }
        }
    
        return Ok(playlists);
    }

    [HttpDelete("{playlistId}/remove-song/{songId}")]
    public async Task<IActionResult> RemoveSongFromPlaylist(Guid playlistId, Guid songId)
    {
        try
        {
            await _supabaseService.RemoveSongFromPlaylistAsync(playlistId, songId);
            return Ok(new { Message = "Song removed successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpDelete("{playlistId}")]
    public async Task<IActionResult> DeletePlaylist(Guid playlistId)
    {
        try
        {
            await _supabaseService.DeletePlaylistAsync(playlistId);
            return Ok(new { Message = "Playlist deleted successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
}
