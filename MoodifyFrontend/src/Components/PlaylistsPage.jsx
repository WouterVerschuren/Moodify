import React, { useState } from "react";
import { Play, Music, Trash2, Plus } from "lucide-react";
import "./PlaylistsPage.css";

const API_PLAYLIST = "http://localhost:5001/api/playlist";

function PlaylistsPage({ songs, playlists, onPlaylistsFetch, onPlayPlaylist }) {
  const [playlistForm, setPlaylistForm] = useState({
    name: "",
    description: "",
  });
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!playlistForm.name) return;

    try {
      await fetch(`${API_PLAYLIST}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...playlistForm, songIds: selectedSongs }),
      });
      setPlaylistForm({ name: "", description: "" });
      setSelectedSongs([]);
      onPlaylistsFetch();
    } catch (err) {
      console.error("Error creating playlist:", err);
    }
  };

  const handleAddSongsToPlaylist = async (playlistId) => {
    if (selectedSongs.length === 0) return;
    try {
      await fetch(`${API_PLAYLIST}/${playlistId}/add-songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedSongs),
      });
      setSelectedSongs([]);
      setShowAddToPlaylist(null);
      onPlaylistsFetch();
    } catch (err) {
      console.error("Error adding songs:", err);
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId, songId) => {
    try {
      await fetch(`${API_PLAYLIST}/${playlistId}/remove-song/${songId}`, {
        method: "DELETE",
      });
      onPlaylistsFetch();
    } catch (err) {
      console.error("Error removing song:", err);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm("Delete this playlist?")) return;
    try {
      await fetch(`${API_PLAYLIST}/${playlistId}`, { method: "DELETE" });
      onPlaylistsFetch();
    } catch (err) {
      console.error("Error deleting playlist:", err);
    }
  };

  const toggleSongSelection = (songId) => {
    setSelectedSongs((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  };

  return (
    <div className="playlists-page">
      <div className="playlist-create-section">
        <h2 className="section-title">Create Playlist</h2>
        <div className="create-form">
          <input
            type="text"
            placeholder="Playlist name"
            value={playlistForm.name}
            onChange={(e) =>
              setPlaylistForm({ ...playlistForm, name: e.target.value })
            }
            className="form-input"
          />
          <textarea
            placeholder="Description"
            value={playlistForm.description}
            onChange={(e) =>
              setPlaylistForm({ ...playlistForm, description: e.target.value })
            }
            className="form-textarea"
          />

          <div className="song-selector">
            <h3 className="selector-title">
              Select Songs ({selectedSongs.length})
            </h3>
            <div className="song-list">
              {songs.map((song) => (
                <label
                  key={song.id}
                  className={`song-checkbox ${selectedSongs.includes(song.id) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSongs.includes(song.id)}
                    onChange={() => toggleSongSelection(song.id)}
                    className="checkbox-input"
                  />
                  <span className="song-name">
                    {song.title}{" "}
                    <span className="song-artist">• {song.artist}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleCreatePlaylist} className="create-btn">
            Create Playlist
          </button>
        </div>
      </div>

      <div className="playlists-list-section">
        <h2 className="section-title">All Playlists ({playlists.length})</h2>
        <div className="playlists-container">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="playlist-card">
              <div className="playlist-header">
                <div className="playlist-info">
                  <h3 className="playlist-name">{playlist.name}</h3>
                  <p className="playlist-description">
                    {playlist.description || "No description"}
                  </p>
                </div>
                <div className="playlist-actions">
                  <button
                    onClick={() => onPlayPlaylist(playlist)}
                    className="action-btn play-playlist-btn"
                  >
                    <Play size={20} />
                  </button>
                  <button
                    onClick={() =>
                      setShowAddToPlaylist(
                        showAddToPlaylist === playlist.id ? null : playlist.id
                      )
                    }
                    className="action-btn add-btn"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="action-btn delete-btn"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {showAddToPlaylist === playlist.id && (
                <div className="add-songs-panel">
                  <h4 className="panel-title">Add Songs</h4>
                  <div className="panel-song-list">
                    {songs.map((song) => (
                      <label key={song.id} className="panel-song-item">
                        <input
                          type="checkbox"
                          checked={selectedSongs.includes(song.id)}
                          onChange={() => toggleSongSelection(song.id)}
                          className="panel-checkbox"
                        />
                        <span className="panel-song-name">{song.title}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddSongsToPlaylist(playlist.id)}
                    className="add-selected-btn"
                  >
                    Add Selected
                  </button>
                </div>
              )}

              <div className="playlist-songs">
                {playlist.songs &&
                  playlist.songs.map((song) => (
                    <div key={song.id} className="playlist-song-item">
                      <div className="song-item-info">
                        <Music size={16} className="song-icon" />
                        <span className="song-details">
                          {song.title} - {song.artist}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveSongFromPlaylist(playlist.id, song.id)
                        }
                        className="remove-song-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlaylistsPage;
