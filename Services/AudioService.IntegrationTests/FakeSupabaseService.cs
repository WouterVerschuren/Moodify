using AudioService.Services;
using Microsoft.AspNetCore.Http;
using AudioService.Models;

public class FakeSupabaseService : ISupabaseService
{
    private readonly List<Song> _songs = new()
    {
        new Song { Id = Guid.NewGuid(), Title = "Song One", Artist = "Artist A" },
        new Song { Id = Guid.NewGuid(), Title = "Song Two", Artist = "Artist B" }
    };

    public Task<Song> UploadFileAsync(IFormFile file, string title, string artist, string id)
    {
        var song = new Song
        {
            Id = Guid.NewGuid(),
            Title = title,
            Artist = artist
        };
        _songs.Add(song);
        return Task.FromResult(song);
    }

    public Task<List<Song>> GetSongsAsync()
    {
        return Task.FromResult(_songs.ToList());
    }

    public Task<string?> GetSignedUrlAsync(string path, int expiresInSeconds = 3600)
    {
        return Task.FromResult<string?>($"https://fakeurl.com/{path}");
    }

    public Task<List<Song>> GetSongsByIdsAsync(IEnumerable<Guid> ids)
    {
        var result = _songs.Where(s => ids.Contains(s.Id)).ToList();
        return Task.FromResult(result);
    }

    public Task DeleteSongAsync(string id)
    {
        _songs.RemoveAll(s => s.Id.ToString() == id);
        return Task.CompletedTask;
    }
}
