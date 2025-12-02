using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

public class UserLoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}

public class UserRegisterDto
{
    [Required]
    [MaxLength(20)]
    public string Username { get; set; } = null!;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
    
    [Required]
    public string Password { get; set; } = null!;
}
