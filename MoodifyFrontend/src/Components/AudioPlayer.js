import React, { useEffect, useState } from "react";
import axios from "axios";

const AudioPlayer = () => {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSongsList = async () => {
      try {
        console.log("Fetching songs from:", `${process.env.REACT_APP_API_URL}/api/audio`);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/audio`);
        console.log("Songs data:", res.data);
        setSongs(res.data);
      } catch (err) {
        console.error("Error fetching songs list:", err);
      }
    };

    fetchSongsList();
  }, []);

  const handleSongSelect = (song) => {
    setLoading(true);
    console.log("Selected song:", song);
    console.log("Audio URL will be:", song.SignedUrl); // now uses the signed URL
    setCurrentSong(song);
    setLoading(false);
  };

  if (songs.length === 0) return <div>Loading songs...</div>;

  return (
    <div>
      {currentSong ? (
        <div>
          <h2>Now Playing: {currentSong.title} - {currentSong.artist}</h2>
          <audio 
            controls 
            key={currentSong.id}
            onLoadStart={() => console.log('Audio loading started')}
            onError={(e) => console.error('Audio error:', e.target.error)}
            onCanPlay={() => console.log('Audio can play')}
          >
            <source
              src={currentSong.SignedUrl}
              type="audio/mpeg"
            />
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : (
        <div>
          <h2>Select a song to play</h2>
        </div>
      )}

      {loading && <div>Loading song...</div>}

      <h3>Song List:</h3>
      <ul>
        {songs.map((song) => (
          <li key={song.id}>
            <button onClick={() => handleSongSelect(song)} disabled={loading}>
              {song.title} - {song.artist}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AudioPlayer;
