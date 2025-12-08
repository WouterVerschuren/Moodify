import React, { useState } from "react";
import { Play, Music, Upload, Trash2 } from "lucide-react";
import "./SongsPage.css";

const API_HOST = "https://4.251.168.14.nip.io";

const API_AUDIO = `${API_HOST}/api/Audio`;
const API_USER = `${API_HOST}/api/User`;

export default function SongsPage({
  songs,
  onSongsFetch,
  onPlaySong,
  currentUser,
}) {
  const [uploadForm, setUploadForm] = useState({
    title: "",
    artist: "",
    songMood: "Happy",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (
      !selectedFile ||
      !uploadForm.title ||
      !uploadForm.artist ||
      !currentUser
    )
      return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", uploadForm.title);
    formData.append("artist", uploadForm.artist);
    formData.append("songMood", uploadForm.songMood);

    try {
      setUploading(true);

      // Step 1: Upload the song to the audio service
      const uploadResponse = await fetch(`${API_AUDIO}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload song");
      }

      const uploadedSong = await uploadResponse.json();

      // Step 2: Add the song to the current user's library
      const addToUserResponse = await fetch(
        `${API_USER}/${currentUser.id}/songs/${uploadedSong.id}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!addToUserResponse.ok) {
        throw new Error("Failed to add song to your library");
      }

      // Reset form and refresh songs list
      setUploadForm({ title: "", artist: "", songMood: "Happy" });
      setSelectedFile(null);
      onSongsFetch();
    } catch (err) {
      console.error("Error uploading:", err);
      alert(err.message || "Failed to upload song. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSong = async (e, songId) => {
    e.stopPropagation(); // Prevent playing the song when clicking delete

    if (
      !window.confirm(
        "Are you sure you want to remove this song from your library?"
      )
    ) {
      return;
    }

    try {
      setDeleting(songId);

      // Remove the song from the user's library
      const response = await fetch(
        `${API_USER}/${currentUser.id}/songs/${songId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove song from library");
      }

      onSongsFetch(); // Refresh the songs list
    } catch (err) {
      console.error("Error deleting song:", err);
      alert(err.message || "Failed to remove song. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="songs-page">
      <div className="upload-section">
        <h2 className="section-title">Upload New gay Song</h2>
        <p className="section-description">
          Add songs to your personal music library
        </p>
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
            disabled={
              uploading ||
              !selectedFile ||
              !uploadForm.title ||
              !uploadForm.artist
            }
            className="upload-btn"
          >
            {uploading ? "Uploading..." : "Add Song"}
          </button>
        </div>
      </div>

      <div className="songs-list-section">
        <h2 className="section-title">My Library ({songs.length})</h2>
        <div className="songs-container">
          {songs.length === 0 ? (
            <div className="empty-state">
              <Music size={48} color="#4b5563" />
              <p>Your music library is empty</p>
              <p className="empty-state-subtitle">
                Upload your first song to get started!
              </p>
            </div>
          ) : (
            songs.map((song) => (
              <div key={song.id} className="song-card">
                <div className="song-info" onClick={() => onPlaySong(song)}>
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
                  <button
                    className="play-btn-icon"
                    onClick={() => onPlaySong(song)}
                    title="Play song"
                  >
                    <Play size={22} className="play-icon" />
                  </button>
                  <button
                    className="delete-btn-icon"
                    onClick={(e) => handleDeleteSong(e, song.id)}
                    disabled={deleting === song.id}
                    title="Remove from library"
                  >
                    <Trash2
                      size={20}
                      className={`delete-icon ${deleting === song.id ? "deleting" : ""}`}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
