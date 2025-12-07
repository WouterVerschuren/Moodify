    using System.Net.Http.Headers;
    using System.Text.Json;
    using System.Text;
    using AuthService.Models;
    using BCrypt.Net;

    namespace AuthService.Services
    {
        public class SupabaseAuthService : ISupabaseAuthService
        {
            private readonly Supabase.Client _supabase;
            private readonly HttpClient _httpClient;
            private readonly string _restUrl;
            private readonly string _serviceRoleKey;

            public SupabaseAuthService()
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

            public async Task<User> CreateUserAsync(string email, string password, string username)
            {
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

                var userJson = new
                {
                    id = Guid.NewGuid(),
                    Email = email,
                    Username = username,
                    PasswordHash = passwordHash 
                };

                var json = JsonSerializer.Serialize(userJson);
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
                    throw new Exception($"Supabase user creation failed: {response.StatusCode} {resp}");
                }

                var respContent = await response.Content.ReadAsStringAsync();

                return JsonSerializer.Deserialize<List<User>>(respContent, 
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true })?.First()
                    ?? throw new Exception("Failed to parse Supabase response");
            }

            public async Task<User?> GetUserByEmailAsync(string email)
            {
                var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrl}?select=*&Email=eq.{email}");
                request.Headers.Add("apikey", _serviceRoleKey);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

                var response = await _httpClient.SendAsync(request);
                var respContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode) return null;

                var users = JsonSerializer.Deserialize<List<User>>(respContent) ?? new List<User>();
                return users.FirstOrDefault();
            }
            public async Task<User?> GetUserByIdAsync(Guid id)
            {
                var request = new HttpRequestMessage(HttpMethod.Get, $"{_restUrl}?select=*&id=eq.{id}");
                request.Headers.Add("apikey", _serviceRoleKey);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
            
                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode) return null;
            
                var respContent = await response.Content.ReadAsStringAsync();
                var users = JsonSerializer.Deserialize<List<User>>(respContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<User>();
            
                return users.FirstOrDefault();
            }


            
        }
    }
