using DotNetEnv;
using Microsoft.OpenApi.Models;
using AuthService.Services;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

DotNetEnv.Env.Load(); 

var builder = WebApplication.CreateBuilder(args);

// Kestrel setup
builder.WebHost.UseUrls("http://0.0.0.0:8080");

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000","http://4.251.168.14.nip.io") 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Services
builder.Services.AddSingleton<ISupabaseAuthService, SupabaseAuthService>();
builder.Services.AddSingleton<IJWTService, JWTService>();

var jwtSecret = builder.Configuration["JWT_SECRET"];
if (string.IsNullOrEmpty(jwtSecret))
{
    throw new InvalidOperationException("JWT_SECRET configuration is missing.");
}

builder.Services.AddAuthentication("JwtAuth")
    .AddJwtBearer("JwtAuth", options =>
    {
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret)
            ),
            ValidateIssuer = false,
            ValidateAudience = false
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["jwt"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });
// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AuthService API",
        Version = "v1",
        Description = "Authentication service for Moodify using Supabase"
    });

    c.UseInlineDefinitionsForEnums();
});

var app = builder.Build();

app.UseCors("AllowReactApp");

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

// HTTPS redirect only outside dev
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();  
app.UseAuthorization();   

app.MapControllers();

app.Run();
