using DotNetEnv;
using Microsoft.OpenApi.Models;
using AuthService.Services;
using System.Text.Json.Serialization;

DotNetEnv.Env.Load(); 

var builder = WebApplication.CreateBuilder(args);

// Make Kestrel listen on all network interfaces (required for Docker)
builder.WebHost.UseUrls("http://0.0.0.0:8080");

// Add CORS 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add controllers with JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Register SupabaseService for dependency injection
builder.Services.AddSingleton<ISupabaseService, SupabaseService>();

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AuthService API",
        Version = "v1",
        Description = "Authentication service using Supabase"
    });

    // Show enums as strings in Swagger UI 
    c.UseInlineDefinitionsForEnums();
});

var app = builder.Build();

// Use CORS
app.UseCors("AllowReactApp");

// Enable Swagger always (works in Docker & local)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AuthService API v1");
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();

app.Run();
