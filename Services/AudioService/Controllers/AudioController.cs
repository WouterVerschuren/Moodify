using Microsoft.AspNetCore.Mvc;
using MoodifyAPI.Models;
using MoodifyAPI.Services;

namespace MoodifyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AudioController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public AudioController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] UploadSongForm form)
        {
            if (form.File == null || form.File.Length == 0)
                return BadRequest("No file uploaded.");

            var song = await _supabase.UploadFileAsync(
                form.File,
                form.Title,
                form.Artist,
                form.SongMood.ToString()
            );

            return Ok(new { message = "Song uploaded successfully!", song });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var songs = await _supabase.GetSongsAsync();

            foreach (var song in songs)
            {
                var signedUrl = await _supabase.GetSignedUrlAsync(song.StoragePath);
                if (!string.IsNullOrEmpty(signedUrl))
                    song.SignedUrl = signedUrl;
            }

            return Ok(songs);
        }

        [HttpDelete("{storagePath}")]
        public async Task<IActionResult> Delete(string storagePath)
        {
            await _supabase.DeleteSongAsync(storagePath);
            return Ok(new { message = "Song deleted successfully!" });
        }
    }
}
