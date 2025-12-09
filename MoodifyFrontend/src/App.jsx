import React, { useState, useEffect } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import AudioPlayer from "./Components/AudioPlayer";
import SongsPage from "./Components/SongsPage";
import PlaylistsPage from "./Components/PlaylistsPage";
import LoginForm from "./Components/LoginForm";
import RegisterForm from "./Components/RegisterForm";
import "./App.css";

const API_HOST = "https://4.251.168.14.nip.io";

const API_AUDIO = `${API_HOST}/api/Audio`;
const API_USER = `${API_HOST}/api/User`;
const API_PLAYLIST = `${API_HOST}/api/Playlist`;
const API_AUTH = `${API_HOST}/api/Auth`;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [currentPage, setCurrentPage] = useState("songs");
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchSongs();
      fetchPlaylists();
    }
  }, [isAuthenticated, currentUser]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_AUTH}/verify`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  };

  const fetchSongs = async () => {
    if (!currentUser) return;

    try {
      // Handle both lowercase 'id' and uppercase 'Id' (C# convention)
      const userId = currentUser.id || currentUser.Id;

      // Get user's song IDs
      const userSongsResponse = await fetch(`${API_USER}/${userId}/songs`, {
        credentials: "include",
      });

      if (!userSongsResponse.ok) {
        console.error("Failed to fetch user songs:", userSongsResponse.status);
        setSongs([]);
        return;
      }

      const songIds = await userSongsResponse.json();

      if (!songIds || songIds.length === 0) {
        setSongs([]);
        return;
      }

      // Fetch full song details using batch endpoint
      const idsString = songIds.join(",");
      const songsResponse = await fetch(`${API_AUDIO}/batch?ids=${idsString}`, {
        credentials: "include",
      });

      if (!songsResponse.ok) {
        throw new Error("Failed to fetch song details");
      }

      const songsData = await songsResponse.json();
      console.log("Fetched songs:", songsData); // Debug log

      // Make sure each song has the right URL property for the audio player
      const processedSongs = songsData.map((song) => ({
        ...song,
        // Use signedUrl if available, otherwise storagePath
        storagePath:
          song.signedUrl ||
          song.SignedUrl ||
          song.storagePath ||
          song.StoragePath,
      }));

      setSongs(processedSongs);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setSongs([]);
    }
  };

  const fetchPlaylists = async () => {
    if (!currentUser) return;

    try {
      // Handle both lowercase 'id' and uppercase 'Id' (C# convention)
      const userId = currentUser.id || currentUser.Id;

      // Get user's playlist IDs
      const userPlaylistsResponse = await fetch(
        `${API_USER}/${userId}/playlists`,
        {
          credentials: "include",
        }
      );

      if (!userPlaylistsResponse.ok) {
        console.error(
          "Failed to fetch user playlists:",
          userPlaylistsResponse.status
        );
        setPlaylists([]);
        return;
      }

      const playlistIds = await userPlaylistsResponse.json();

      if (!playlistIds || playlistIds.length === 0) {
        setPlaylists([]);
        return;
      }

      // Fetch full playlist details for each playlist ID
      const playlistPromises = playlistIds.map(async (playlistId) => {
        try {
          const response = await fetch(`${API_PLAYLIST}/${playlistId}`, {
            credentials: "include",
          });
          if (response.ok) {
            return response.json();
          }
          return null;
        } catch (err) {
          console.error(`Error fetching playlist ${playlistId}:`, err);
          return null;
        }
      });

      const playlistsData = await Promise.all(playlistPromises);
      const validPlaylists = playlistsData.filter(
        (playlist) => playlist !== null
      );
      setPlaylists(validPlaylists);
    } catch (err) {
      console.error("Error fetching playlists:", err);
      setPlaylists([]);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_AUTH}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSongs([]);
    setPlaylists([]);
    setCurrentTrack(null);
  };

  const playSong = (song) => {
    setCurrentTrack(song);
    setCurrentPlaylist([song]);
    setCurrentIndex(0);
  };

  const playPlaylist = (playlist) => {
    if (playlist.songs && playlist.songs.length > 0) {
      setCurrentTrack(playlist.songs[0]);
      setCurrentPlaylist(playlist.songs);
      setCurrentIndex(0);
    }
  };

  const handleIndexChange = (newIndex) => {
    setCurrentIndex(newIndex);
    setCurrentTrack(currentPlaylist[newIndex]);
  };

  if (!isAuthenticated) {
    return authView === "login" ? (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthView("register")}
      />
    ) : (
      <RegisterForm
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthView("login")}
      />
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-tabs">
            <button
              onClick={() => setCurrentPage("songs")}
              className={`nav-tab ${currentPage === "songs" ? "active" : ""}`}
            >
              Songs
            </button>
            <button
              onClick={() => setCurrentPage("playlists")}
              className={`nav-tab ${currentPage === "playlists" ? "active" : ""}`}
            >
              Playlists
            </button>
          </div>
          <div className="navbar-user">
            <div className="user-info">
              <UserIcon size={20} />
              <span>{currentUser?.username}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="main-content-inner">
          {currentPage === "songs" ? (
            <SongsPage
              songs={songs}
              onSongsFetch={fetchSongs}
              onPlaySong={playSong}
              currentUser={currentUser}
            />
          ) : (
            <PlaylistsPage
              songs={songs}
              playlists={playlists}
              onPlaylistsFetch={fetchPlaylists}
              onPlayPlaylist={playPlaylist}
              currentUser={currentUser}
            />
          )}
        </div>
      </main>

      <AudioPlayer
        currentTrack={currentTrack}
        currentPlaylist={currentPlaylist}
        currentIndex={currentIndex}
        onIndexChange={handleIndexChange}
      />
    </div>
  );
}
