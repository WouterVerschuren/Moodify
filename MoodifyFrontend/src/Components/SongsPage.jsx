import React, { useState } from "react";
import { Play, Music, Upload, Trash2 } from "lucide-react";
import "./SongsPage.css";

const API_HOST = "https://4.251.168.14.nip.io";

const API_AUDIO = `${API_HOST}/api/Audio`;
const API_USER = `${API_HOST}/api/User`;
const API_PLAYLIST = `${API_HOST}/api/Playlist`;

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
    ) {
      alert("Please fill in all fields and select a file");
      return;
    }

    // Get user ID
    const userId = currentUser.id || currentUser.Id;
    if (!userId) {
      alert("User ID not found");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", uploadForm.title);
    formData.append("artist", uploadForm.artist);
    formData.append("songMood", uploadForm.songMood);

    try {
      setUploading(true);

      // Step 1: Upload the song
      console.log("Starting upload...");
      const uploadResponse = await fetch(`${API_AUDIO}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log("Upload response status:", uploadResponse.status);
      console.log("Upload response headers:", uploadResponse.headers);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // Parse the response
      const responseText = await uploadResponse.text();
      console.log("Raw response text:", responseText);

      let uploadData;
      try {
        uploadData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response was:", responseText);
        throw new Error("Invalid JSON response from server");
      }

      console.log("Parsed upload data:", uploadData);
      console.log("Song object:", uploadData.song);

      // Get the song from response
      if (!uploadData.song) {
        console.error("No song in response. Full response:", uploadData);
        throw new Error("No song object in response");
      }

      const song = uploadData.song;
      console.log("Song ID:", song.id);

      if (!song.id) {
        console.error("No ID in song. Song object:", song);
        console.error("Song keys:", Object.keys(song));
        throw new Error("No ID in song object");
      }

      const songId = song.id;
      console.log("Using song ID:", songId);

      // Step 2: Add song to user
      console.log(`Adding song ${songId} to user ${userId}`);
      const addUrl = `${API_USER}/${userId}/songs/${songId}`;
      console.log("POST URL:", addUrl);

      const addToUserResponse = await fetch(addUrl, {
        method: "POST",
        credentials: "include",
      });

      console.log("Add to user response status:", addToUserResponse.status);

      if (!addToUserResponse.ok) {
        const errorText = await addToUserResponse.text();
        console.error("Add to user failed:", errorText);
        throw new Error("Failed to add song to your library");
      }

      console.log("Song successfully added to user!");

      // Reset form and refresh
      setUploadForm({ title: "", artist: "", songMood: "Happy" });
      setSelectedFile(null);
      onSongsFetch();

      alert("Song uploaded successfully!");
    } catch (err) {
      console.error("Error in handleUpload:", err);
      alert(err.message || "Failed to upload song. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSong = async (e, songId) => {
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to remove this song from your library? This will also remove it from all playlists."
      )
    ) {
      return;
    }

    const userId = currentUser.id || currentUser.Id;

    try {
      setDeleting(songId);

      // Step 1: Remove song from all playlists
      const removeFromPlaylistsResponse = await fetch(
        `${API_PLAYLIST}/remove-from-playlists/${songId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!removeFromPlaylistsResponse.ok) {
        const errorText = await removeFromPlaylistsResponse.text();
        console.error("Remove from playlists failed:", errorText);
        throw new Error("Failed to remove song from playlists");
      }

      // Step 2: Remove song from user library
      const response = await fetch(`${API_USER}/${userId}/songs/${songId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to remove song from library");
      }

      onSongsFetch();
      alert("Song removed successfully!");
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
        <h2 className="section-title">Upload New Song</h2>
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
            required
          />
          <input
            type="text"
            placeholder="Artist"
            value={uploadForm.artist}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, artist: e.target.value })
            }
            className="form-input"
            required
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
