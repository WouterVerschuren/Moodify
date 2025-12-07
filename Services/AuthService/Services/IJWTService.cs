namespace AuthService.Services
{
    public interface IJWTService
    {
        string GenerateToken(Models.User user);
        Guid? ValidateToken(string token); 
    }
}
