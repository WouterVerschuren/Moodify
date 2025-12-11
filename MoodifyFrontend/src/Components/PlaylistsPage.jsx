import React, { useState } from "react";
import { Play, Music, Trash2, Plus, X } from "lucide-react";
import "./PlaylistsPage.css";

const API_HOST = "https://4.251.168.14.nip.io";

const API_PLAYLIST = `${API_HOST}/api/Playlist`;
const API_USER = `${API_HOST}/api/User`;

export default function PlaylistsPage({
  songs,
  playlists,
  onPlaylistsFetch,
  onPlayPlaylist,
  currentUser,
}) {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showAddSongs, setShowAddSongs] = useState(false);

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

      console.log("Creating playlist...");
      console.log("Request body:", {
        name: newPlaylistName,
        description: newPlaylistDesc || null,
      });
      console.log("API URL:", `${API_PLAYLIST}/create`);

      const createResponse = await fetch(`${API_PLAYLIST}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDesc || null,
        }),
      });

      console.log("Create playlist response status:", createResponse.status);

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error("Create playlist failed:", errorText);
        throw new Error("Failed to create playlist");
      }

      const responseText = await createResponse.text();
      console.log("Create playlist response:", responseText);

      let playlist;
      try {
        playlist = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid response from server");
      }

      console.log("Created playlist:", playlist);

      const playlistId = playlist.id || playlist.Id;

      if (!playlistId) {
        console.error("No playlist ID in response:", playlist);
        throw new Error("No playlist ID returned");
      }

      console.log("Created playlist ID:", playlistId);

      // Add playlist to user
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
      setNewPlaylistDesc("");
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

    if (
      !window.confirm(
        "Are you sure you want to delete this playlist? This will remove it completely."
      )
    ) {
      return;
    }

    const userId = currentUser?.id || currentUser?.Id;
    if (!userId) {
      alert("User not logged in");
      return;
    }

    try {
      setDeleting(playlistId);
      console.log(`Deleting playlist ${playlistId} for user ${userId}...`);

      // Remove playlist from user's library
      const removeFromUserResp = await fetch(
        `${API_USER}/${userId}/playlists/${playlistId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!removeFromUserResp.ok)
        throw new Error("Failed to remove playlist from user");
      console.log("Playlist removed from user");

      // Call your backend to delete playlist + all its songs
      const deleteResp = await fetch(`${API_PLAYLIST}/${playlistId}/delete`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!deleteResp.ok) throw new Error("Failed to delete playlist");
      console.log("Playlist deleted successfully from backend!");

      onPlaylistsFetch();
      alert("Playlist deleted successfully!");
    } catch (err) {
      console.error("Error deleting playlist:", err);
      alert(err.message || "Failed to delete playlist. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleAddSongsToPlaylist = async (playlistId, songIds) => {
    if (!songIds || songIds.length === 0) {
      alert("Please select at least one song");
      return;
    }

    try {
      console.log(`Adding songs to playlist ${playlistId}:`, songIds);
      const response = await fetch(`${API_PLAYLIST}/${playlistId}/add-songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(songIds),
      });

      if (!response.ok) {
        throw new Error("Failed to add songs to playlist");
      }

      onPlaylistsFetch();
      setShowAddSongs(false);
      setSelectedPlaylist(null);
      alert("Songs added to playlist!");
    } catch (err) {
      console.error("Error adding songs:", err);
      alert(err.message || "Failed to add songs. Please try again.");
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId, songId) => {
    if (!window.confirm("Remove this song from the playlist?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_PLAYLIST}/${playlistId}/remove-song/${songId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove song");
      }

      onPlaylistsFetch();
      alert("Song removed from playlist!");
    } catch (err) {
      console.error("Error removing song:", err);
      alert(err.message || "Failed to remove song. Please try again.");
    }
  };

  const openAddSongsModal = (e, playlist) => {
    e.stopPropagation();
    setSelectedPlaylist(playlist);
    setShowAddSongs(true);
  };

  return (
    <div className="playlists-page">
      <div className="upload-section">
        <h2 className="section-title">Create New Playlist</h2>
        <p className="section-description">
          Organize your music into playlists
        </p>
        <div className="upload-form-playlist">
          <input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="form-input"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newPlaylistDesc}
            onChange={(e) => setNewPlaylistDesc(e.target.value)}
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
            playlists.map((playlist) => {
              const playlistId = playlist.id || playlist.Id;
              const songCount =
                playlist.songIds?.length || playlist.SongIds?.length || 0;

              return (
                <div key={playlistId} className="playlist-card-wrapper">
                  <div className="song-card">
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
                        <div className="song-artist">{songCount} songs</div>
                      </div>
                    </div>
                    <div className="song-actions">
                      <button
                        className="add-songs-btn"
                        onClick={(e) => openAddSongsModal(e, playlist)}
                        title="Add songs to playlist"
                      >
                        <Plus size={20} />
                      </button>
                      <button
                        className="play-btn-icon"
                        onClick={() => onPlayPlaylist(playlist)}
                        title="Play playlist"
                        disabled={songCount === 0}
                      >
                        <Play size={22} className="play-icon" />
                      </button>
                      <button
                        className="delete-btn-icon"
                        onClick={(e) => handleDeletePlaylist(e, playlistId)}
                        disabled={deleting === playlistId}
                        title="Delete playlist"
                      >
                        <Trash2
                          size={20}
                          className={`delete-icon ${deleting === playlistId ? "deleting" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Show songs in playlist */}
                  {songCount > 0 && (
                    <div className="playlist-songs">
                      {(playlist.songIds || playlist.SongIds || [])
                        .slice(0, 3)
                        .map((songId, index) => {
                          const song = songs.find(
                            (s) => (s.id || s.Id) === songId
                          );
                          if (!song) return null;

                          return (
                            <div key={songId} className="playlist-song-item">
                              <span>
                                {index + 1}. {song.title || song.Title}
                              </span>
                              <button
                                className="remove-song-btn"
                                onClick={() =>
                                  handleRemoveSongFromPlaylist(
                                    playlistId,
                                    songId
                                  )
                                }
                                title="Remove from playlist"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      {songCount > 3 && (
                        <div className="more-songs">
                          + {songCount - 3} more songs
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Songs Modal */}
      {showAddSongs && selectedPlaylist && (
        <div className="modal-overlay" onClick={() => setShowAddSongs(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Add Songs to {selectedPlaylist.name || selectedPlaylist.Name}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAddSongs(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {songs.length === 0 ? (
                <p className="no-songs-message">
                  You don't have any songs yet. Upload some first!
                </p>
              ) : (
                <div className="song-selection-list">
                  {songs.map((song) => {
                    const songId = song.id || song.Id;
                    const playlistSongIds =
                      selectedPlaylist.songIds ||
                      selectedPlaylist.SongIds ||
                      [];
                    const isInPlaylist = playlistSongIds.includes(songId);

                    return (
                      <div
                        key={songId}
                        className={`selectable-song ${isInPlaylist ? "disabled" : ""}`}
                        onClick={() =>
                          !isInPlaylist &&
                          handleAddSongsToPlaylist(
                            selectedPlaylist.id || selectedPlaylist.Id,
                            [songId]
                          )
                        }
                      >
                        <Music size={20} />
                        <div className="song-details">
                          <div className="song-name">
                            {song.title || song.Title}
                          </div>
                          <div className="song-artist-small">
                            {song.artist || song.Artist}
                          </div>
                        </div>
                        {isInPlaylist && (
                          <span className="already-added">
                            Already in playlist
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
