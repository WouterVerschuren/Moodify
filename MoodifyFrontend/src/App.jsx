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
      // Get user's song IDs
      const userSongsResponse = await fetch(
        `${API_USER}/${currentUser.id}/songs`,
        {
          credentials: "include",
        }
      );

      if (!userSongsResponse.ok) {
        throw new Error("Failed to fetch user songs");
      }

      const songIds = await userSongsResponse.json();

      if (!songIds || songIds.length === 0) {
        setSongs([]);
        return;
      }

      // Fetch full song details for each song ID
      const songPromises = songIds.map(async (songId) => {
        const response = await fetch(`${API_AUDIO}/${songId}`, {
          credentials: "include",
        });
        if (response.ok) {
          return response.json();
        }
        return null;
      });

      const songsData = await Promise.all(songPromises);
      const validSongs = songsData.filter((song) => song !== null);
      setSongs(validSongs);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setSongs([]);
    }
  };

  const fetchPlaylists = async () => {
    if (!currentUser) return;

    try {
      const res = await fetch(`${API_PLAYLIST}/all`, {
        credentials: "include",
      });
      const data = await res.json();
      setPlaylists(data);
    } catch (err) {
      console.error("Error fetching playlists:", err);
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
