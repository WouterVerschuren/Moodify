namespace AuthService.Models
{
    public class UserInfoResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? UserId { get; set; }
    }
}
