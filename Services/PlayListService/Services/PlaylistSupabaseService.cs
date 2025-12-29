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

        var playlist = JsonSerializer.Deserialize<List<Playlist>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })?.FirstOrDefault() ?? throw new Exception("Failed to create playlist.");

        return playlist;
    }

    public async Task AddSongsToPlaylistAsync(Guid playlistId, List<Guid> songIds)
    {
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
    }

    public async Task RemoveSongFromPlaylistAsync(Guid playlistId, Guid songId)
    {
        var response = await _httpClient.DeleteAsync(
            $"{_restUrl}/PlaylistSongs?playlistId=eq.{playlistId}&songId=eq.{songId}"
        );

        var responseBody = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new Exception($"Supabase error: {response.StatusCode} - {responseBody}");
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

    public async Task<List<Playlist>> GetPlaylistsByIdsAsync(List<Guid> playlistIds)
    {
        if (!playlistIds.Any()) return new List<Playlist>();

        var idsParam = string.Join(",", playlistIds.Select(id => $"\"{id}\""));
        var response = await _httpClient.GetAsync($"{_restUrl}/Playlists?id=in.({idsParam})");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var playlists = JsonSerializer.Deserialize<List<Playlist>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<Playlist>();
    
        foreach (var playlist in playlists)
        {
            playlist.SongIds = await GetSongIdsAsync(playlist.Id);
        }

        return playlists;
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
        // Remove all songs from the playlist first
        var removeSongsResponse = await _httpClient.DeleteAsync($"{_restUrl}/PlaylistSongs?playlistId=eq.{playlistId}");
        var removeSongsBody = await removeSongsResponse.Content.ReadAsStringAsync();
        if (!removeSongsResponse.IsSuccessStatusCode)
            throw new Exception($"Supabase error removing songs: {removeSongsResponse.StatusCode} - {removeSongsBody}");

        // Then delete the playlist itself
        var deletePlaylistResponse = await _httpClient.DeleteAsync($"{_restUrl}/Playlists?id=eq.{playlistId}");
        var deletePlaylistBody = await deletePlaylistResponse.Content.ReadAsStringAsync();
        if (!deletePlaylistResponse.IsSuccessStatusCode)
            throw new Exception($"Supabase error deleting playlist: {deletePlaylistResponse.StatusCode} - {deletePlaylistBody}");
    }

    public async Task RemoveSongFromAllPlaylistsAsync(Guid songId)
    {
        var response = await _httpClient.DeleteAsync($"{_restUrl}/PlaylistSongs?songId=eq.{songId}");
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Supabase error removing song from playlists: {response.StatusCode} - {responseBody}");
    }

}
