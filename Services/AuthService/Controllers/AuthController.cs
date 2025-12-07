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

        [HttpGet("health")]
        public IActionResult Get() => Ok(new { status = "Healthy" });

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var existingUser = await _supabaseService.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
                return BadRequest("User already exists");

            var user = await _supabaseService.CreateUserAsync(request.Email, request.Password, request.Username);
            var token = _jwtService.GenerateToken(user);

            Response.Cookies.Append("jwt", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = false, // for HTTP testing
                Path = "/",
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new { user });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _supabaseService.GetUserByEmailAsync(request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized("Invalid email or password");

            var jwtToken = _jwtService.GenerateToken(user);

            Response.Cookies.Append("jwt", jwtToken, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = false, // for HTTP testing
                Path = "/",
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new { user });
        }

        [HttpGet("verify")]
        public async Task<IActionResult> Verify()
        {
            var jwt = Request.Cookies["jwt"];
            if (string.IsNullOrEmpty(jwt)) return Unauthorized(new { error = "No token" });

            var userId = _jwtService.ValidateToken(jwt);
            if (userId == null) return Unauthorized(new { error = "Invalid token" });

            var user = await _supabaseService.GetUserByIdAsync(userId.Value);
            if (user == null) return Unauthorized(new { error = "User not found" });

            return Ok(new { user });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwt");
            return Ok(new { message = "Logged out successfully" });
        }
    }
}
