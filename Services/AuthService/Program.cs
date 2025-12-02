using DotNetEnv;
using Microsoft.OpenApi.Models;
using AuthService.Services;
using System.Text.Json.Serialization;

DotNetEnv.Env.Load(); // Load environment variables from .env

var builder = WebApplication.CreateBuilder(args);

// Make Kestrel listen on all network interfaces (needed for Docker)
builder.WebHost.UseUrls("http://0.0.0.0:8080");

// Add CORS so React frontend can call API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // React frontend
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add controllers and JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Register Auth services for DI
builder.Services.AddSingleton<ISupabaseAuthService, SupabaseAuthService>();
builder.Services.AddSingleton<IJWTService, JWTService>();

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AuthService API",
        Version = "v1",
        Description = "Authentication service for Moodify using Supabase"
    });

    // Display enums as strings in Swagger
    c.UseInlineDefinitionsForEnums();
});

var app = builder.Build();

// Use CORS first
app.UseCors("AllowReactApp");

// Swagger UI (always enabled, works in Docker & local)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AuthService API v1");
});

// Only use HTTPS redirection if not in Docker/dev
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();

app.Run();
