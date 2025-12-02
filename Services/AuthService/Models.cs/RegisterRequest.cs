using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace AuthService.Models
{
    public class RegisterRequest
    {
        [Required]
        [MaxLength(20)]
        public string Username { get; set; } = null!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        public string Password  { get; set; } = null!;
    }
}
