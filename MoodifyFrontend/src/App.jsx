import React, { useState, useEffect } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import AudioPlayer from "./Components/AudioPlayer";
import SongsPage from "./Components/SongsPage";
import PlaylistsPage from "./Components/PlaylistsPage";
import LoginForm from "./Components/LoginForm";
import RegisterForm from "./Components/RegisterForm";
import "./App.css";

// Use your deployed ingress host
const API_HOST = "http://4.251.168.14.nip.io";

const API_AUDIO = `${API_HOST}/api/Audio`;
const API_PLAYLIST = `${API_HOST}/api/Playlist`;
const API_AUTH = `${API_HOST}/api/Auth`;
const API_USER = `${API_HOST}/api/User`;

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
    if (isAuthenticated) {
      fetchSongs();
      fetchPlaylists();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_AUTH}/verify`, {
        credentials: "include",
      });

      if (!response.ok) {
        setIsAuthenticated(false);
        return;
      }

      const data = await response.json();
      setCurrentUser(data.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Auth check failed:", err);
      setIsAuthenticated(false);
    }
  };

  const fetchSongs = async () => {
    try {
      const res = await fetch(`${API_AUDIO}/all`, { credentials: "include" });
      if (!res.ok) {
        console.error("Fetch songs failed:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      setSongs(data);
    } catch (err) {
      console.error("Error fetching songs:", err);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${API_PLAYLIST}/all`, {
        credentials: "include",
      });
      if (!res.ok) {
        console.error("Fetch playlists failed:", res.status, res.statusText);
        return;
      }
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
