// Models/User.cs
using System.ComponentModel.DataAnnotations;

namespace AuthService.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(20)]
        public string Username { get; set; } = null!;

        [Required, EmailAddress, MaxLength(50)]
        public string Email { get; set; } = null!;

        [Required, MaxLength(200)]
        public string PasswordHash { get; set; } = null!;
    }
}
