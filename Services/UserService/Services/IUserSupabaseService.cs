using UserService.Models;

namespace UserService.Services
{
    public interface IUserService
    {
        Task<User> CreateUserAsync(string email, string username);
        Task<User?> GetUserByIdAsync(Guid id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<List<User>> GetAllUsersAsync();
        Task<User> UpdateUserAsync(Guid id, string? username, string? email);
        Task DeleteUserAsync(Guid id);
    }
}
