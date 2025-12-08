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


        // Methods for managing user-song and user-playlist relationships
        Task AddSongToUserAsync(Guid userId, Guid songId);
        Task RemoveSongFromUserAsync(Guid userId, Guid songId);
        Task AddPlaylistToUserAsync(Guid userId, Guid playlistId);
        Task RemovePlaylistFromUserAsync(Guid userId, Guid playlistId);

        Task<List<Guid>> GetSongsByUserAsync(Guid userId);
        Task<List<Guid>> GetPlaylistsByUserAsync(Guid userId);

    }
}
