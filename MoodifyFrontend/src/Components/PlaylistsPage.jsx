import React, { useState } from "react";
import { Play, Music } from "lucide-react";
import "./PlaylistsPage.css";

const API_PLAYLIST = "http://localhost:5001/api/playlist";

export default function PlaylistsPage({
  songs,
  playlists,
  onPlaylistsFetch,
  onPlayPlaylist,
}) {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      setCreating(true);
      await fetch(`${API_PLAYLIST}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newPlaylistName }),
      });
      setNewPlaylistName("");
      onPlaylistsFetch();
    } catch (err) {
      console.error("Error creating playlist:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="playlists-page">
      <div className="upload-section">
        <h2 className="section-title">Create New Playlist</h2>
        <div className="upload-form">
          <input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="form-input"
          />
          <button
            onClick={handleCreatePlaylist}
            disabled={creating}
            className="upload-btn"
          >
            {creating ? "Creating..." : "Create Playlist"}
          </button>
        </div>
      </div>

      <div className="songs-list-section">
        <h2 className="section-title">Your Playlists ({playlists.length})</h2>
        <div className="songs-container">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onPlayPlaylist(playlist)}
              className="song-card"
            >
              <div className="song-info">
                <div className="song-icon playlist-icon">
                  <Music size={24} color="#fff" />
                </div>
                <div>
                  <div className="song-title">{playlist.name}</div>
                  <div className="song-artist">
                    {playlist.songs?.length || 0} songs
                  </div>
                </div>
              </div>
              <div className="song-actions">
                <Play size={22} className="play-icon" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
