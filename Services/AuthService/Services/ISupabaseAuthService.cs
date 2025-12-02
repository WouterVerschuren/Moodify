using AuthService.Models;

namespace AuthService.Services
{
    public interface ISupabaseAuthService
    {
        Task<User> CreateUserAsync(string email, string password, string username);
        Task<User?> GetUserByEmailAsync(string email);
    }
}
