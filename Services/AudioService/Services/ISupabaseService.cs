using AudioService.Models;

namespace AudioService.Services
{
    public interface ISupabaseService
    {
        Task<Song> UploadFileAsync(IFormFile file, string title, string artist, string songMood);
        Task<List<Song>> GetSongsAsync();
        Task<string?> GetSignedUrlAsync(string path, int expiresInSeconds = 3600);
        Task DeleteSongAsync(string storagePath);
    }
}
