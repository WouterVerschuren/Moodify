using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using AudioService.Models;
using System.Text.RegularExpressions;

namespace AudioService.Services
{
    public class SupabaseService : ISupabaseService
    {
        private readonly Supabase.Client _supabase;
        private readonly string _bucketName;
        private readonly HttpClient _httpClient;
        private readonly string _restUrl;
        private readonly string _serviceRoleKey;

        public SupabaseService()
        {
            var url = Environment.GetEnvironmentVariable("SUPABASE_AUDIOSERVICE_URL")
                      ?? throw new Exception("SUPABASE_AUDIOSERVICE_URL not set");
            _serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_AUDIOSERVICE_SERVICE_ROLE")
                      ?? throw new Exception("SUPABASE_AUDIOSERVICE_SERVICE_ROLE not set");
            _bucketName = Environment.GetEnvironmentVariable("SUPABASE_AUDIOSERVICE_BUCKET") ?? "Moodify-Songs";

            _restUrl = $"{url}/rest/v1/Songs";
            _supabase = new Supabase.Client(url, _serviceRoleKey);
            _supabase.InitializeAsync().GetAwaiter().GetResult();

            _httpClient = new HttpClient();
        }

        // Upload file + save metadata
        public async Task<Song> UploadFileAsync(IFormFile file, string title, string artist, string songMood)
{
    if (file == null || file.Length == 0)
        throw new ArgumentException("No file provided.");

    // Sanitize filename: remove spaces and special characters
    var sanitizedFileName = Path.GetFileNameWithoutExtension(file.FileName);
    sanitizedFileName = Regex.Replace(sanitizedFileName, @"[^a-zA-Z0-9]", ""); // keep only letters/numbers

    var extension = Path.GetExtension(file.FileName);
    var uniqueFileName = $"{Guid.NewGuid()}_{sanitizedFileName}{extension}";

    var bucket = _supabase.Storage.From(_bucketName);

    using (var ms = new MemoryStream())
    {
        await file.CopyToAsync(ms);
        var fileBytes = ms.ToArray();

        var uploadedPath = await bucket.Upload(fileBytes, uniqueFileName, new Supabase.Storage.FileOptions
        {
            ContentType = file.ContentType ?? "audio/mpeg",
            Upsert = true
        });

        Console.WriteLine($"Uploaded file path in Supabase: {uploadedPath}");

        var song = new Song
        {
            Id = Guid.NewGuid(),
            Title = title,
            Artist = artist,
            StoragePath = uniqueFileName,
            SongMood = songMood,
            ContentType = file.ContentType ?? "audio/mpeg"
        };

        await CreateSongAsync(song);
        return song;
    }
}

        // Create signed URL (skip missing files)
        public async Task<string?> GetSignedUrlAsync(string path, int expiresInSeconds = 3600)
        {
            try
            {
                if (string.IsNullOrEmpty(path))
                    return null;

                return await _supabase.Storage.From(_bucketName).CreateSignedUrl(path, expiresInSeconds);
            }
            catch (Supabase.Storage.Exceptions.SupabaseStorageException ex)
            {
                Console.WriteLine($" Skipped missing file: {path} ({ex.Message})");
                return null;
            }
        }

        // Save metadata
        public async Task CreateSongAsync(Song song)
        {
            var songJson = new
            {
                id = song.Id,  
                title = song.Title,
                artist = song.Artist,
                storagePath = song.StoragePath,
                songMood = song.SongMood,
                contentType = song.ContentType
            };

            var json = JsonSerializer.Serialize(songJson);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, _restUrl)
            {
                Content = content
            };

            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var resp = await response.Content.ReadAsStringAsync();
                throw new Exception($"Supabase insert failed: {response.StatusCode} {resp}");
            }
        }

        // Fetch songs (still uses direct REST call)
        public async Task<List<Song>> GetSongsAsync()
{
    var request = new HttpRequestMessage(HttpMethod.Get, _restUrl + "?select=*");
    request.Headers.Add("apikey", _serviceRoleKey);
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

    var response = await _httpClient.SendAsync(request);
    var respContent = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
        throw new Exception($"Supabase fetch failed: {response.StatusCode} {respContent}");

    var songs = JsonSerializer.Deserialize<List<Song>>(respContent,
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Song>();
        
    string publicBaseUrl = "https://ntbhghwtfmgdorwevudq.supabase.co/storage/v1/object/public/Moodify-Songs/";

    foreach (var song in songs)
    {
        if (!string.IsNullOrEmpty(song.StoragePath) && !song.StoragePath.StartsWith("http"))
        {
            song.StoragePath = $"{publicBaseUrl}{song.StoragePath}";
        }
    }

    return songs;
}

        // Delete file + metadata
        public async Task DeleteSongAsync(string storagePath)
        {
            await _supabase.Storage.From(_bucketName).Remove(storagePath);

            var request = new HttpRequestMessage(HttpMethod.Delete, $"{_restUrl}?storagePath=eq.{storagePath}");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            var respContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Supabase delete failed: {response.StatusCode} {respContent}");
        }

        public async Task<List<Song>> GetSongsByIdsAsync(IEnumerable<Guid> ids)
{
    if (!ids.Any())
        return new List<Song>();

    var idsString = string.Join(",", ids.Select(id => $"\"{id}\""));

    var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrl}?select=*&id=in.({idsString})");
    request.Headers.Add("apikey", _serviceRoleKey);
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

    var response = await _httpClient.SendAsync(request);
    var respContent = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
        throw new Exception($"Supabase fetch failed: {response.StatusCode} {respContent}");

    var songs = JsonSerializer.Deserialize<List<Song>>(respContent,
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Song>();

    string publicBaseUrl = "https://ntbhghwtfmgdorwevudq.supabase.co/storage/v1/object/public/Moodify-Songs/";
    foreach (var song in songs)
    {
        if (!string.IsNullOrEmpty(song.StoragePath) && !song.StoragePath.StartsWith("http"))
            song.StoragePath = $"{publicBaseUrl}{song.StoragePath}";
    }

    return songs;
}

    }
}
