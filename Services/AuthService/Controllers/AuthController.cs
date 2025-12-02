using Microsoft.AspNetCore.Mvc;
using AuthService.Models;
using AuthService.Services;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ISupabaseAuthService _supabaseService;
        private readonly IJWTService _jwtService;

        public AuthController(ISupabaseAuthService supabaseService, IJWTService jwtService)
        {
            _supabaseService = supabaseService;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // check of user al bestaat
            var existingUser = await _supabaseService.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
                return BadRequest("User already exists");

            // hash password en sla user op
            var user = await _supabaseService.CreateUserAsync(request.Email, request.Password , request.Username);

            // genereer JWT token
            var token = _jwtService.GenerateToken(user);

            return Ok(new { Token = token, User = user });
        }

       [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _supabaseService.GetUserByEmailAsync(request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password , user.PasswordHash))
                return Unauthorized("Invalid email or password");

            var token = _jwtService.GenerateToken(user);
            return Ok(new { Token = token, User = user });
        }
    }
}
