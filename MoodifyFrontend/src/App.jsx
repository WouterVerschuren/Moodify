import React, { useState, useEffect, useCallback } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import AudioPlayer from "./Components/AudioPlayer";
import SongsPage from "./Components/SongsPage";
import PlaylistsPage from "./Components/PlaylistsPage";
import LoginForm from "./Components/LoginForm";
import RegisterForm from "./Components/RegisterForm";
import "./App.css";

const API_HOST = "https://4.251.168.14.nip.io";

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

  const checkAuth = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchSongs = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.id || currentUser.Id;

      const userSongsResponse = await fetch(`${API_USER}/${userId}/songs`, {
        credentials: "include",
      });

      if (!userSongsResponse.ok) {
        setSongs([]);
        return;
      }

      const songIds = await userSongsResponse.json();

      if (!songIds || songIds.length === 0) {
        setSongs([]);
        return;
      }

      const idsString = songIds.join(",");
      const songsResponse = await fetch(`${API_AUDIO}/batch?ids=${idsString}`, {
        credentials: "include",
      });

      if (!songsResponse.ok) {
        throw new Error("Failed to fetch song details");
      }

      const songsData = await songsResponse.json();

      const processedSongs = songsData.map((song) => ({
        ...song,
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
  }, [currentUser]);

  const fetchPlaylists = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.id || currentUser.Id;

      const userPlaylistsResponse = await fetch(
        `${API_USER}/${userId}/playlists`,
        { credentials: "include" }
      );

      if (!userPlaylistsResponse.ok) {
        setPlaylists([]);
        return;
      }

      const playlistIds = await userPlaylistsResponse.json();

      if (!playlistIds || playlistIds.length === 0) {
        setPlaylists([]);
        return;
      }

      const idsString = playlistIds
        .map((id) => id.replace(/['"[\]]/g, ""))
        .join(",");

      const playlistsResponse = await fetch(
        `${API_PLAYLIST}/batch?ids=${idsString}`,
        { credentials: "include" }
      );

      if (!playlistsResponse.ok) {
        setPlaylists([]);
        return;
      }

      const playlistsData = await playlistsResponse.json();
      setPlaylists(playlistsData);
    } catch (err) {
      console.error("Error fetching playlists:", err);
      setPlaylists([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchSongs();
      fetchPlaylists();
    }
  }, [isAuthenticated, currentUser, fetchSongs, fetchPlaylists]);

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

  const playPlaylist = async (playlist) => {
    const songIds = playlist.songIds || playlist.SongIds || [];

    if (!songIds || songIds.length === 0) {
      alert("This playlist is empty");
      return;
    }

    try {
      const idsString = songIds.join(",");
      const songsResponse = await fetch(`${API_AUDIO}/batch?ids=${idsString}`, {
        credentials: "include",
      });

      if (!songsResponse.ok) {
        throw new Error("Failed to fetch playlist songs");
      }

      const playlistSongs = await songsResponse.json();

      const processedSongs = playlistSongs.map((song) => ({
        ...song,
        storagePath:
          song.signedUrl ||
          song.SignedUrl ||
          song.storagePath ||
          song.StoragePath,
      }));

      setCurrentTrack(processedSongs[0]);
      setCurrentPlaylist(processedSongs);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error loading playlist:", err);
      alert("Failed to load playlist");
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
