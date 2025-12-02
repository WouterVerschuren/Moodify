import React, { useState } from "react";
import { Play, Music, Upload } from "lucide-react";
import "./SongsPage.css";

const API_AUDIO = "http://localhost:5000/api/audio";

function SongsPage({ songs, onSongsFetch, onPlaySong }) {
  const [uploadForm, setUploadForm] = useState({
    title: "",
    artist: "",
    songMood: "Happy",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.title || !uploadForm.artist) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", uploadForm.title);
    formData.append("artist", uploadForm.artist);
    formData.append("songMood", uploadForm.songMood);

    try {
      setUploading(true);
      await fetch(`${API_AUDIO}/upload`, { method: "POST", body: formData });
      setUploadForm({ title: "", artist: "", songMood: "Happy" });
      setSelectedFile(null);
      onSongsFetch();
    } catch (err) {
      console.error("Error uploading:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="songs-page">
      <div className="upload-section">
        <h2 className="section-title">Upload New Song</h2>
        <div className="upload-form">
          <input
            type="text"
            placeholder="Song title"
            value={uploadForm.title}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, title: e.target.value })
            }
            className="form-input"
          />
          <input
            type="text"
            placeholder="Artist"
            value={uploadForm.artist}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, artist: e.target.value })
            }
            className="form-input"
          />
          <select
            value={uploadForm.songMood}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, songMood: e.target.value })
            }
            className="form-select"
          >
            <option>Happy</option>
            <option>Sad</option>
            <option>Chill</option>
            <option>Energetic</option>
            <option>Romantic</option>
          </select>
          <label
            className={`file-label ${selectedFile ? "file-selected" : ""}`}
          >
            <Upload size={20} />
            {selectedFile ? selectedFile.name : "Choose audio file"}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="file-input"
            />
          </label>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? "Uploading..." : "Add Song"}
          </button>
        </div>
      </div>

      <div className="songs-list-section">
        <h2 className="section-title">All Songs ({songs.length})</h2>
        <div className="songs-container">
          {songs.map((song) => (
            <div
              key={song.id}
              onClick={() => onPlaySong(song)}
              className="song-card"
            >
              <div className="song-info">
                <div className="song-icon">
                  <Music size={24} color="#fff" />
                </div>
                <div>
                  <div className="song-title">{song.title}</div>
                  <div className="song-artist">{song.artist}</div>
                </div>
              </div>
              <div className="song-actions">
                <span className="mood-badge">{song.songMood}</span>
                <Play size={22} className="play-icon" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SongsPage;
