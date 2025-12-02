using Xunit;
using Moq;
using AudioService.Controllers;
using AudioService.Services;
using AudioService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;


public class AudioControllerTests
{
    [Fact]
    public async Task Upload_ReturnsBadRequest_WhenNoFile()
    {
        // Arrange
        var mockSupabase = new Mock<ISupabaseService>();
        var controller = new AudioController(mockSupabase.Object);

        var form = new UploadSongForm
        {
            File = null,
            Title = "Test Song",
            Artist = "Test Artist",
            SongMood = Mood.Happy
        };

        // Act
        var result = await controller.Upload(form);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_ReturnsSongsList()
    {
        // Arrange
        var mockSupabase = new Mock<ISupabaseService>();
        mockSupabase.Setup(s => s.GetSongsAsync())
            .ReturnsAsync(new List<Song>
            {
            new Song { Id = Guid.NewGuid(), Title = "Song1", StoragePath = "song1.mp3" },
            new Song { Id = Guid.NewGuid(), Title = "Song2", StoragePath = "song2.mp3" }
            });

        var controller = new AudioController(mockSupabase.Object);

        // Act
        var result = await controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var songs = Assert.IsType<List<Song>>(okResult.Value);
        Assert.Equal(2, songs.Count);
    }

    [Fact]
    public async Task Delete_ReturnsOk_WhenSongDeleted()
    {
        // Arrange
        var mockSupabase = new Mock<ISupabaseService>();
        mockSupabase.Setup(s => s.DeleteSongAsync("song.mp3")).Returns(Task.CompletedTask);

        var controller = new AudioController(mockSupabase.Object);

        // Act
        var result = await controller.Delete("song.mp3");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Contains("Song deleted successfully!", okResult.Value!.ToString());
    }




    [Fact]
    public async Task Upload_ReturnsOk_WhenFileProvided()
    {
        var mockSupabase = new Mock<ISupabaseService>();
        mockSupabase.Setup(s => s.UploadFileAsync(
            It.IsAny<IFormFile>(), 
            It.IsAny<string>(), 
            It.IsAny<string>(), 
            It.IsAny<string>()
        )).ReturnsAsync(new Song { Id = Guid.NewGuid(), Title = "Test" });

        var controller = new AudioController(mockSupabase.Object);

        var fileMock = new Mock<IFormFile>();
        var content = "Fake song content";
        var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
        fileMock.Setup(f => f.OpenReadStream()).Returns(stream);
        fileMock.Setup(f => f.Length).Returns(stream.Length);
        fileMock.Setup(f => f.FileName).Returns("song.mp3");

        var form = new UploadSongForm
        {
            File = fileMock.Object,
            Title = "Test Song",
            Artist = "Test Artist",
            SongMood = Mood.Happy
        };

        // Act
        var result = await controller.Upload(form);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Contains("Song uploaded successfully!", okResult.Value!.ToString());
    }
}
