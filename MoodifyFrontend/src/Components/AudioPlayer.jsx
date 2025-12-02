import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Music,
} from "lucide-react";
import "./AudioPlayer.css";

function AudioPlayer({
  currentTrack,
  currentPlaylist,
  currentIndex,
  onIndexChange,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      const handleTimeUpdate = () => setProgress(audioRef.current.currentTime);
      const handleLoadedMetadata = () => setDuration(audioRef.current.duration);
      const handleEnded = () => {
        if (repeat) {
          audioRef.current.play();
        } else if (currentPlaylist.length > 1) {
          handleNext();
        } else {
          setIsPlaying(false);
        }
      };

      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
      audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      audioRef.current.addEventListener("ended", handleEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
          audioRef.current.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );
          audioRef.current.removeEventListener("ended", handleEnded);
        }
      };
    }
  }, [currentPlaylist, currentIndex, repeat]);

  useEffect(() => {
    if (currentTrack && audioRef.current && isPlaying) {
      audioRef.current.play();
    }
  }, [currentTrack]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (currentPlaylist.length === 0) return;
    let nextIdx;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * currentPlaylist.length);
    } else {
      nextIdx = (currentIndex + 1) % currentPlaylist.length;
    }
    onIndexChange(nextIdx);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (currentPlaylist.length === 0) return;
    const prevIdx =
      currentIndex === 0 ? currentPlaylist.length - 1 : currentIndex - 1;
    onIndexChange(prevIdx);
    setIsPlaying(true);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="audio-player">
      <div className="audio-player-content">
        {currentTrack ? (
          <>
            <div className="track-info">
              <div className="track-icon">
                <Music size={28} color="#fff" />
              </div>
              <div>
                <div className="track-title">{currentTrack.title}</div>
                <div className="track-artist">{currentTrack.artist}</div>
              </div>
            </div>

            <div className="player-controls">
              <div className="controls-buttons">
                <button
                  onClick={() => setShuffle(!shuffle)}
                  className={`control-btn ${shuffle ? "active" : ""}`}
                >
                  <Shuffle size={18} />
                </button>
                <button
                  onClick={handlePrev}
                  disabled={currentPlaylist.length <= 1}
                  className="control-btn"
                >
                  <SkipBack size={22} />
                </button>
                <button onClick={togglePlay} className="play-btn">
                  {isPlaying ? (
                    <Pause size={24} />
                  ) : (
                    <Play size={24} className="play-icon" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentPlaylist.length <= 1}
                  className="control-btn"
                >
                  <SkipForward size={22} />
                </button>
                <button
                  onClick={() => setRepeat(!repeat)}
                  className={`control-btn ${repeat ? "active" : ""}`}
                >
                  <Repeat size={18} />
                </button>
              </div>

              <div className="progress-container">
                <span className="time-display">{formatTime(progress)}</span>
                <div onClick={handleSeek} className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(progress / duration) * 100}%` }}
                  />
                </div>
                <span className="time-display time-end">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="spacer" />
            <audio ref={audioRef} src={currentTrack.storagePath} />
          </>
        ) : (
          <div className="no-track">Select a song to start playing</div>
        )}
      </div>
    </div>
  );
}

export default AudioPlayer;
