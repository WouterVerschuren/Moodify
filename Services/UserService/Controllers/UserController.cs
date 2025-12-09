using Microsoft.AspNetCore.Mvc;
using UserService.Models;
using UserService.Services;
using Microsoft.AspNetCore.Authorization;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult Get() => Ok(new { status = "Healthy" });

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] User user)
        {
            var createdUser = await _userService.CreateUserAsync(user.Email, user.Username);
            return Ok(createdUser);
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] User user)
        {
            var updatedUser = await _userService.UpdateUserAsync(id, user.Username, user.Email);
            return Ok(updatedUser);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            await _userService.DeleteUserAsync(id);
            return NoContent();
        }

        [HttpPost("{userId}/songs/{songId}")]
        public async Task<IActionResult> AddSongToUser(Guid userId, Guid songId)
        {
            await _userService.AddSongToUserAsync(userId, songId);
            return Ok("Song added to user");
        }
        
        [HttpDelete("{userId}/songs/{songId}")]
        public async Task<IActionResult> RemoveSongFromUser(Guid userId, Guid songId)
        {
            await _userService.RemoveSongFromUserAsync(userId, songId);
            return Ok("Song removed from user");
        }
        
        [HttpPost("{userId}/playlists/{playlistId}")]
        public async Task<IActionResult> AddPlaylistToUser(Guid userId, Guid playlistId)
        {
            await _userService.AddPlaylistToUserAsync(userId, playlistId);
            return Ok("Playlist added to user");
        }
        
        [HttpDelete("{userId}/playlists/{playlistId}")]
        public async Task<IActionResult> RemovePlaylistFromUser(Guid userId, Guid playlistId)
        {
            await _userService.RemovePlaylistFromUserAsync(userId, playlistId);
            return Ok("Playlist removed from user");
        }

        [HttpGet("{userId}/songs")]
        public async Task<IActionResult> GetSongsByUser(Guid userId)
        {
            var songIds = await _userService.GetSongsByUserAsync(userId);
            return Ok(songIds); // array van GUIDs
        }

        [HttpGet("{userId}/playlists")]
        public async Task<IActionResult> GetPlaylistsByUser(Guid userId)
        {
            var playlistIds = await _userService.GetPlaylistsByUserAsync(userId);
            return Ok(playlistIds); 
        }

    }
}
