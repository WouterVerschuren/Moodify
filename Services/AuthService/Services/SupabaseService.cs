using System;
using System.Threading.Tasks;
using Supabase;
using AuthService.Models;

namespace AuthService.Services
{
    public interface ISupabaseService
    {
        Task<AuthResponse> SignUpAsync(SignupRequest request);
        Task<AuthResponse> SignInAsync(SigninRequest request);
        Task<UserInfoResponse> GetUserInfoAsync(string accessToken);
    }

    public class SupabaseService : ISupabaseService
    {
        private readonly string _url;
        private readonly string _serviceRoleKey;
        private readonly Client _supabaseClient;

       public SupabaseService()
       {
         _url = Environment.GetEnvironmentVariable("SUPABASE_URL")
           ?? throw new ArgumentNullException("SUPABASE_URL is not set");
         _serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE")
                         ?? throw new ArgumentNullException("SUPABASE_SERVICE_ROLE is not set");

         _supabaseClient = new Client(_url, _serviceRoleKey);
    }          

        public async Task<AuthResponse> SignUpAsync(SignupRequest request)
        {
            var session = await _supabaseClient.Auth.SignUp(request.Email, request.Password);

            if (session?.User == null)
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "Signup failed"
                };
            }

            return new AuthResponse
            {
                Success = true,
                Message = "Signup successful",
                AccessToken = session.AccessToken,
                RefreshToken = session.RefreshToken,
                UserId = session.User.Id
            };
        }

        public async Task<AuthResponse> SignInAsync(SigninRequest request)
        {
            var session = await _supabaseClient.Auth.SignIn(request.Email, request.Password);

            if (session?.User == null)
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "Signin failed"
                };
            }

            return new AuthResponse
            {
                Success = true,
                Message = "Signin successful",
                AccessToken = session.AccessToken,
                RefreshToken = session.RefreshToken,
                UserId = session.User.Id
            };
        }

        public async Task<UserInfoResponse> GetUserInfoAsync(string accessToken)
        {
            var user = await _supabaseClient.Auth.GetUser(accessToken);

            if (user == null)
            {
                return new UserInfoResponse
                {
                    Success = false,
                    Message = "Unable to retrieve user info"
                };
            }

            return new UserInfoResponse
            {
                Success = true,
                Message = "User info retrieved",
                Email = user.Email,
                UserId = user.Id
            };
        }
    }
}
