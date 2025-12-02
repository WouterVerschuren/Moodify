import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AudioPlayer.css";

const API_URL = "http://localhost:5000/api/audio";
console.log("API_URL:", API_URL);

const AudioPlayer = () => {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [songMood, setSongMood] = useState("Happy");

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await axios.get(API_URL);
      setSongs(res.data);
      console.log("Fetched songs:", res.data);
    } catch (err) {
      console.error("Error fetching songs:", err);
    }
  };

  const handleSongSelect = (song) => {
    setLoading(true);
    setCurrentSong(song);
    setLoading(false);
  };

  const handleDelete = async (song) => {
    try {
      await axios.delete(
        `${API_URL}/${encodeURIComponent(song.storagePath.split("/").pop())}`
      );
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
      console.log(`✅ Deleted song: ${song.title}`);
    } catch (err) {
      console.error("Error deleting song:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || !artist) {
      console.error("⚠️ Please fill in all fields and select a file!");
      return;
    }

    const formData = new FormData();
    formData.append("File", file);
    formData.append("Title", title);
    formData.append("Artist", artist);
    formData.append("SongMood", songMood);

    try {
      setUploading(true);
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(`✅ Song uploaded: ${res.data.song.title}`);

      // Refetch all songs from API to get correct data including signed URLs
      fetchSongs();

      // Reset form
      setFile(null);
      setTitle("");
      setArtist("");
      setSongMood("Happy");
    } catch (err) {
      console.error("❌ Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <h1 className="logo">🎧 Moodify</h1>
      </header>

      <main className="main-content">
        {/* Upload Section */}
        <section className="upload-section">
          <h2>Add a new song</h2>
          <form className="upload-form" onSubmit={handleUpload}>
            <input
              type="text"
              placeholder="Song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
            <select
              value={songMood}
              onChange={(e) => setSongMood(e.target.value)}
            >
              <option>Happy</option>
              <option>Sad</option>
              <option>Chill</option>
              <option>Energetic</option>
            </select>

            <label htmlFor="file-upload" className="custom-file-upload">
              {file ? file.name : "🎵 Pick song file 🎵"}
            </label>
            <input
              id="file-upload"
              type="file"
              accept="audio/mpeg"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Add Song"}
            </button>
          </form>
        </section>

        {/* Song List Section */}
        <section className="song-list-section">
          <h2>Available Songs</h2>
          <div className="song-list">
            {songs.map((song) => (
              <div key={song.id} className="song-item">
                <div
                  className="song-info"
                  onClick={() => handleSongSelect(song)}
                >
                  <span className="song-title">{song.title}</span> -{" "}
                  <span className="song-artist">{song.artist}</span>
                  <span
                    className={`song-mood mood-${song.songMood.toLowerCase()}`}
                  >
                    {song.songMood}
                  </span>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(song)}
                  disabled={loading}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Audio Player */}
      {currentSong && (
        <footer className="audio-player-bar">
          <div className="player-info">
            <h3>{currentSong.title}</h3>
            <p>{currentSong.artist}</p>
          </div>
          <audio controls key={currentSong.id} className="custom-audio">
            <source src={currentSong.storagePath} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </footer>
      )}
    </div>
  );
};

export default AudioPlayer;
