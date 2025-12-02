using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using PlaylistService.Models;

namespace PlaylistService.Services;

public class PlaylistSupabaseService : IPlaylistSupabaseService
{
    private readonly HttpClient _httpClient;
    private readonly string _restUrl;

    public PlaylistSupabaseService()
    {
        var url = Environment.GetEnvironmentVariable("SUPABASE_PLAYLISTSERVICE_URL")
                  ?? throw new Exception("SUPABASE_PLAYLISTSERVICE_URL not set");
        var serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_PLAYLISTSERVICE_SERVICE_ROLE")
                  ?? throw new Exception("SUPABASE_PLAYLISTSERVICE_SERVICE_ROLE not set");

        _restUrl = $"{url}/rest/v1";
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("apikey", serviceRoleKey);
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
    }

    public async Task<Playlist> CreatePlaylistAsync(string name, string? description)
    {
        var payload = JsonSerializer.Serialize(new { name, description });
        var content = new StringContent(payload, Encoding.UTF8, "application/json");
        content.Headers.Add("Prefer", "return=representation");

        var response = await _httpClient.PostAsync($"{_restUrl}/Playlists", content);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Supabase error: {response.StatusCode} - {json}");

        Console.WriteLine("Supabase response: " + json);

        var playlist = JsonSerializer.Deserialize<List<Playlist>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })?.FirstOrDefault()
          ?? throw new Exception("Failed to create playlist (empty response)");

        if (playlist.Id == Guid.Empty)
            throw new Exception("Playlist ID was empty — check your Supabase table or model mapping");

        return playlist;
    }

    public async Task AddSongsToPlaylistAsync(Guid playlistId, List<Guid> songIds)
    {
        if (playlistId == Guid.Empty)
            throw new Exception("Invalid playlistId: Guid.Empty");

        if (songIds == null || !songIds.Any())
            throw new Exception("No songs provided to add.");

        var payload = songIds.Select(id => new
        {
            playlistId = playlistId.ToString(),
            songId = id.ToString()
        });

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        content.Headers.Add("Prefer", "return=representation");

        var response = await _httpClient.PostAsync($"{_restUrl}/PlaylistSongs", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Supabase error: {response.StatusCode} - {responseBody}");

        Console.WriteLine($"Added songs: {responseBody}");
    }

    public async Task<List<Playlist>> GetAllPlaylistsAsync()
    {
        var response = await _httpClient.GetAsync($"{_restUrl}/Playlists");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<Playlist>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<Playlist>();
    }

    public async Task DeletePlaylistAsync(Guid playlistId)
    {
        if (playlistId == Guid.Empty)
            throw new Exception("Invalid playlistId: Guid.Empty");

        var response = await _httpClient.DeleteAsync($"{_restUrl}/Playlists?id=eq.{playlistId}");
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Supabase error: {response.StatusCode} - {responseBody}");

        Console.WriteLine($"Deleted playlist {playlistId}");
    }

    public async Task RemoveSongFromPlaylistAsync(Guid playlistId, Guid songId)
    {
        if (playlistId == Guid.Empty || songId == Guid.Empty)
            throw new Exception("Invalid playlistId or songId: Guid.Empty");
    
        var response = await _httpClient.DeleteAsync(
            $"{_restUrl}/PlaylistSongs?playlistId=eq.{playlistId}&songId=eq.{songId}"
        );
    
        var responseBody = await response.Content.ReadAsStringAsync();
    
        if (!response.IsSuccessStatusCode)
            throw new Exception($"Supabase error: {response.StatusCode} - {responseBody}");
    
        Console.WriteLine($"Removed song {songId} from playlist {playlistId}");
    }

    public async Task<Playlist?> GetPlaylistAsync(Guid playlistId)
    {
        var response = await _httpClient.GetAsync($"{_restUrl}/Playlists?id=eq.{playlistId}");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<Playlist>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })?.FirstOrDefault();
    }

    public async Task<List<Guid>> GetSongIdsAsync(Guid playlistId)
    {
        var response = await _httpClient.GetAsync($"{_restUrl}/PlaylistSongs?playlistId=eq.{playlistId}");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var songs = JsonSerializer.Deserialize<List<PlaylistSong>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<PlaylistSong>();

        return songs.Select(x => Guid.Parse(x.SongId)).ToList();
    }
}
