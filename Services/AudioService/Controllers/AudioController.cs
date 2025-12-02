using Microsoft.AspNetCore.Mvc;
using AudioService.Models;
using AudioService.Services;

namespace AudioService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AudioController : ControllerBase
    {
        private readonly ISupabaseService _supabase;

        public AudioController(ISupabaseService supabase)
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

        [HttpGet("batch")]
public async Task<IActionResult> GetBatch([FromQuery] string ids)
{
    if (string.IsNullOrEmpty(ids))
        return BadRequest("No song IDs provided.");

    var idList = ids.Split(',')
                .Select(id => Guid.Parse(id)) 
                .ToList();

    var songs = await _supabase.GetSongsByIdsAsync(idList);

    foreach (var song in songs)
    {
        var signedUrl = await _supabase.GetSignedUrlAsync(song.StoragePath);
        if (!string.IsNullOrEmpty(signedUrl))
            song.SignedUrl = signedUrl;
    }

    return Ok(songs);
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
