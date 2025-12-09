import React, { useState } from "react";
import { Play, Music, Trash2 } from "lucide-react";
import "./PlaylistsPage.css";

const API_HOST = "https://4.251.168.14.nip.io";

const API_USER = `${API_HOST}/api/User`;
const API_PLAYLIST = `${API_HOST}/api/Playlist`;

export default function PlaylistsPage({
  songs,
  playlists,
  onPlaylistsFetch,
  onPlayPlaylist,
  currentUser,
}) {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      alert("Please enter a playlist name");
      return;
    }

    if (!currentUser) {
      alert("User not found");
      return;
    }

    const userId = currentUser.id || currentUser.Id;

    try {
      setCreating(true);

      // Step 1: Create the playlist
      console.log("Creating playlist...");
      const createResponse = await fetch(`${API_PLAYLIST}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newPlaylistName }),
      });

      console.log("Create playlist response status:", createResponse.status);

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error("Create playlist failed:", errorText);
        throw new Error("Failed to create playlist");
      }

      // Parse response to get playlist ID
      const responseText = await createResponse.text();
      console.log("Create playlist response:", responseText);

      let createData;
      try {
        createData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid response from server");
      }

      console.log("Created playlist data:", createData);

      // Get playlist ID from response
      const playlist = createData.playlist || createData;
      const playlistId = playlist.id || playlist.Id;

      if (!playlistId) {
        console.error("No playlist ID in response:", createData);
        throw new Error("No playlist ID returned");
      }

      console.log("Created playlist ID:", playlistId);

      // Step 2: Add playlist to user
      console.log(`Adding playlist ${playlistId} to user ${userId}`);
      const addToUserResponse = await fetch(
        `${API_USER}/${userId}/playlists/${playlistId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      console.log(
        "Add playlist to user response status:",
        addToUserResponse.status
      );

      if (!addToUserResponse.ok) {
        const errorText = await addToUserResponse.text();
        console.error("Add playlist to user failed:", errorText);
        throw new Error("Failed to add playlist to your library");
      }

      console.log("Playlist successfully added to user!");

      setNewPlaylistName("");
      onPlaylistsFetch();
      alert("Playlist created successfully!");
    } catch (err) {
      console.error("Error creating playlist:", err);
      alert(err.message || "Failed to create playlist. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlaylist = async (e, playlistId) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this playlist?")) {
      return;
    }

    const userId = currentUser.id || currentUser.Id;

    try {
      setDeleting(playlistId);

      // Remove playlist from user's library
      const response = await fetch(
        `${API_USER}/${userId}/playlists/${playlistId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete playlist");
      }

      onPlaylistsFetch();
    } catch (err) {
      console.error("Error deleting playlist:", err);
      alert(err.message || "Failed to delete playlist. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="playlists-page">
      <div className="upload-section">
        <h2 className="section-title">Create New Playlist</h2>
        <p className="section-description">
          Organize your music into playlists
        </p>
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
            disabled={creating || !newPlaylistName.trim()}
            className="upload-btn"
          >
            {creating ? "Creating..." : "Create Playlist"}
          </button>
        </div>
      </div>

      <div className="songs-list-section">
        <h2 className="section-title">My Playlists ({playlists.length})</h2>
        <div className="songs-container">
          {playlists.length === 0 ? (
            <div className="empty-state">
              <Music size={48} color="#4b5563" />
              <p>You don't have any playlists yet</p>
              <p className="empty-state-subtitle">
                Create your first playlist to organize your music!
              </p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <div key={playlist.id || playlist.Id} className="song-card">
                <div
                  className="song-info"
                  onClick={() => onPlayPlaylist(playlist)}
                >
                  <div className="song-icon playlist-icon">
                    <Music size={24} color="#fff" />
                  </div>
                  <div>
                    <div className="song-title">
                      {playlist.name || playlist.Name}
                    </div>
                    <div className="song-artist">
                      {playlist.songs?.length || playlist.Songs?.length || 0}{" "}
                      songs
                    </div>
                  </div>
                </div>
                <div className="song-actions">
                  <button
                    className="play-btn-icon"
                    onClick={() => onPlayPlaylist(playlist)}
                    title="Play playlist"
                  >
                    <Play size={22} className="play-icon" />
                  </button>
                  <button
                    className="delete-btn-icon"
                    onClick={(e) =>
                      handleDeletePlaylist(e, playlist.id || playlist.Id)
                    }
                    disabled={deleting === (playlist.id || playlist.Id)}
                    title="Delete playlist"
                  >
                    <Trash2
                      size={20}
                      className={`delete-icon ${deleting === (playlist.id || playlist.Id) ? "deleting" : ""}`}
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
