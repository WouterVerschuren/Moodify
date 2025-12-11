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
      const userId = currentUser.id || currentUser.Id;

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

      const idsString = songIds.join(",");
      const songsResponse = await fetch(`${API_AUDIO}/batch?ids=${idsString}`, {
        credentials: "include",
      });

      if (!songsResponse.ok) {
        throw new Error("Failed to fetch song details");
      }

      const songsData = await songsResponse.json();
      console.log("Fetched songs:", songsData);

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
  };

  const fetchPlaylists = async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.id || currentUser.Id;

      console.log("Fetching playlists for user:", userId);

      // Step 1: Get user's playlist IDs
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
      console.log("User's playlist IDs:", playlistIds);

      if (!playlistIds || playlistIds.length === 0) {
        console.log("No playlists found for user");
        setPlaylists([]);
        return;
      }

      // Step 2: Use batch endpoint to get all playlists at once
      const idsString = playlistIds
        .map((id) => id.replace(/['"\[\]]/g, "")) // remove quotes/brackets if any
        .join(",");
      console.log("Fetching playlists batch:", idsString);

      const playlistsResponse = await fetch(
        `${API_PLAYLIST}/batch?ids=${idsString}`,
        {
          credentials: "include",
        }
      );

      if (!playlistsResponse.ok) {
        console.error(
          "Failed to fetch playlists batch:",
          playlistsResponse.status
        );
        setPlaylists([]);
        return;
      }

      const playlistsData = await playlistsResponse.json();
      console.log("Fetched playlists:", playlistsData);

      setPlaylists(playlistsData);
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

  const playPlaylist = async (playlist) => {
    const songIds = playlist.songIds || playlist.SongIds || [];

    if (!songIds || songIds.length === 0) {
      alert("This playlist is empty");
      return;
    }

    try {
      // Fetch song details for all songs in the playlist
      const idsString = songIds.join(",");
      const songsResponse = await fetch(`${API_AUDIO}/batch?ids=${idsString}`, {
        credentials: "include",
      });

      if (!songsResponse.ok) {
        throw new Error("Failed to fetch playlist songs");
      }

      const playlistSongs = await songsResponse.json();

      if (playlistSongs && playlistSongs.length > 0) {
        // Process songs to ensure correct URL property
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
      } else {
        alert("Could not load playlist songs");
      }
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
