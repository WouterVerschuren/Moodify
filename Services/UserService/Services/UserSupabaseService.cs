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
        private readonly Supabase.Client _supabase;
        private readonly HttpClient _httpClient;
        private readonly string _restUrl;
        private readonly string _serviceRoleKey;

        public SupabaseUserService()
        {
            var url = Environment.GetEnvironmentVariable("SUPABASE_USERSERVICE_URL")
                      ?? throw new Exception("SUPABASE_USERSERVICE_URL not set");
            _serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_USERSERVICE_SERVICE_ROLE")
                      ?? throw new Exception("SUPABASE_USERSERVICE_SERVICE_ROLE not set");

            _restUrl = $"{url}/rest/v1/Users";
            _supabase = new Supabase.Client(url, _serviceRoleKey);
            _supabase.InitializeAsync().GetAwaiter().GetResult();

            _httpClient = new HttpClient();
        }

        public async Task<User> CreateUserAsync(string email, string username)
        {
            var userJson = new { email, username };
            var json = JsonSerializer.Serialize(userJson);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, _restUrl)
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
            var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrl}?select=*&id=eq.{id}");
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
            var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrl}?select=*&email=eq.{email}");
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
            var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrl}?select=*");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var respContent = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<User>>(respContent) ?? new List<User>();
        }

        public async Task<User> UpdateUserAsync(Guid id, string? username, string? email)
        {
            var updateJson = new { username, email };
            var json = JsonSerializer.Serialize(updateJson);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Patch, $"{_restUrl}?id=eq.{id}")
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
            var request = new HttpRequestMessage(HttpMethod.Delete, $"{_restUrl}?id=eq.{id}");
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
        }
    }
}
