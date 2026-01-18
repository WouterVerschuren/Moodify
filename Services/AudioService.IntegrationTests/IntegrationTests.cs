using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

public class AudioControllerTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AudioControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/api/Audio/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_ReturnsSongs()
    {
        var response = await _client.GetAsync("/api/Audio/all");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
