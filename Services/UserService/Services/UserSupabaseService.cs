using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using UserService.Models;
using Supabase;

namespace UserService.Services
{
    public class SupabaseUserService : IUserService
    {
        private readonly HttpClient _httpClient;
        private readonly string _restUrlUsers;
        private readonly string _restUrlUserSongs;
        private readonly string _restUrlUserPlaylists;
        private readonly string _serviceRoleKey;

        public SupabaseUserService()
        {
            var url = Environment.GetEnvironmentVariable("SUPABASE_USERSERVICE_URL")
                      ?? throw new Exception("SUPABASE_USERSERVICE_URL not set");
            _serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_USERSERVICE_SERVICE_ROLE")
                      ?? throw new Exception("SUPABASE_USERSERVICE_SERVICE_ROLE not set");

            _restUrlUsers = $"{url}/rest/v1/Users";
            _restUrlUserSongs = $"{url}/rest/v1/UserSongs";
            _restUrlUserPlaylists = $"{url}/rest/v1/UserPlaylists";

            _httpClient = new HttpClient();
        }

        public async Task<User> CreateUserAsync(string email, string username)
        {
            var json = JsonSerializer.Serialize(new { email, username });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, _restUrlUsers)
            {
                Content = content
            };
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var respContent = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<User>>(respContent)?.First()
                   ?? throw new Exception("Failed to parse Supabase response");
        }

        public async Task<User?> GetUserByIdAsync(Guid id)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrlUsers}?select=*&id=eq.{id}");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            var respContent = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode) return null;

            var users = JsonSerializer.Deserialize<List<User>>(respContent) ?? new List<User>();
            return users.FirstOrDefault();
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrlUsers}?select=*&email=eq.{email}");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            var respContent = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode) return null;

            var users = JsonSerializer.Deserialize<List<User>>(respContent) ?? new List<User>();
            return users.FirstOrDefault();
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrlUsers}?select=*");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var respContent = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<User>>(respContent) ?? new List<User>();
        }

        public async Task<User> UpdateUserAsync(Guid id, string? username, string? email)
        {
            var json = JsonSerializer.Serialize(new { username, email });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Patch, $"{_restUrlUsers}?id=eq.{id}")
            {
                Content = content
            };
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var respContent = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<User>>(respContent)?.First()
                   ?? throw new Exception("Failed to parse Supabase response");
        }

        public async Task DeleteUserAsync(Guid id)
        {
            var request = new HttpRequestMessage(HttpMethod.Delete, $"{_restUrlUsers}?id=eq.{id}");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
        }

        public async Task AddSongToUserAsync(Guid userId, Guid songId)
        {
            var json = JsonSerializer.Serialize(new { userId, songId });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, _restUrlUserSongs)
            {
                Content = content
            };
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
        }

        public async Task RemoveSongFromUserAsync(Guid userId, Guid songId)
        {
            var request = new HttpRequestMessage(HttpMethod.Delete,
                $"{_restUrlUserSongs}?userId=eq.{userId}&songId=eq.{songId}");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
        }

        public async Task AddPlaylistToUserAsync(Guid userId, Guid playlistId)
        {
            var json = JsonSerializer.Serialize(new { UserId = userId, PlaylistId = playlistId });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, _restUrlUserPlaylists)
            {
                Content = content
            };
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
        }

        public async Task RemovePlaylistFromUserAsync(Guid userId, Guid playlistId)
        {
            var request = new HttpRequestMessage(HttpMethod.Delete,
                $"{_restUrlUserPlaylists}?UserId=eq.{userId}&PlaylistId=eq.{playlistId}");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
        }

        public async Task<List<Guid>> GetSongsByUserAsync(Guid userId)
        {
            var request = new HttpRequestMessage(HttpMethod.Get,
                $"{_restUrlUserSongs}?select=songId&userId=eq.{userId}");

            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            var respContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine("Supabase Error: " + respContent);
                return new List<Guid>();
            }

            var userSongs = JsonSerializer.Deserialize<List<UserSong>>(respContent) ?? new List<UserSong>();
            return userSongs.ConvertAll(us => us.songId);
        }

        public async Task<List<Guid>> GetPlaylistsByUserAsync(Guid userId)
        {
            var request = new HttpRequestMessage(HttpMethod.Get,
                $"{_restUrlUserPlaylists}?select=PlaylistId&UserId=eq.{userId}");
        
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        
            var response = await _httpClient.SendAsync(request);
            var respContent = await response.Content.ReadAsStringAsync();
        
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine("Supabase Error: " + respContent);
                return new List<Guid>();
            }
        
            var userPlaylists = JsonSerializer.Deserialize<List<UserPlaylist>>(respContent) ?? new List<UserPlaylist>();
            return userPlaylists.ConvertAll(up => up.PlaylistId);
        }

    }
}
