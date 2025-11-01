using Microsoft.OpenApi.Models;
using AudioService.Services;
using System.Text.Json.Serialization;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

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

// Add controllers with enum as string serialization
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Register SupabaseService via interface
builder.Services.AddSingleton<ISupabaseService, SupabaseService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AudioService API",
        Version = "v1",
        Description = "Upload songs with Supabase"
    });

    // Show enums as strings in Swagger UI
    c.UseInlineDefinitionsForEnums();
});

var app = builder.Build();

// Use CORS before anything else
app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Moodify API V1");
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
