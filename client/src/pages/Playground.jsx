import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./playground.css";

const PIXELS_PER_SECOND = 100;
const STRINGS = ["E", "B", "G", "D", "A", "E"]; // Guitar strings

const Playground = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [level, setLevel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(1);
  const audioRef = useRef(null);
  const timelineRef = useRef(null);

  // Load feedback
  useEffect(() => {
    const raw = localStorage.getItem("feedback");
    const acc = localStorage.getItem("accuracy");
    const lvl = localStorage.getItem("level");

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setFeedback(parsed);
      if (acc) setAccuracy(acc);
      if (lvl) setLevel(lvl);
      else navigate("/upload-audio");
    } catch {
      navigate("/upload-audio");
    }
  }, []);

  // Scroll Timeline with audio
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && audioRef.current && timelineRef.current) {
        const scrollX = audioRef.current.currentTime * PIXELS_PER_SECOND * tempo;
        timelineRef.current.scrollLeft = scrollX - 100;
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, tempo]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = tempo;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="playground-wrapper">
      {/* 🧭 Navbar */}
      <div className="navbar">
        <h3>🎸 Aaroh AI Playground</h3>
       <button className="nav-btn" onClick={() => navigate("/upload-audio")}>
  🎤 Upload Practice Audio
</button>
      </div>

      {/* 🎛️ Controls */}
      <div className="header">
        <h2>🎶 Chord Feedback Timeline</h2>
        <div className="controls">
          <button onClick={togglePlay}>
            {isPlaying ? "⏸ Pause" : "▶️ Play"}
          </button>
          Tempo:
          <button onClick={() => setTempo(0.5)}>0.5x</button>
          <button onClick={() => setTempo(1)}>1x</button>
          <button onClick={() => setTempo(2)}>2x</button>
        </div>
      </div>

      <audio ref={audioRef} src="/your-audio.mp3" />

      {/* Timeline */}
      <div className="timeline-container" ref={timelineRef}>
        <div className="timeline-track">
          <div className="playhead" />

          {feedback.map((item, i) => (
            <div
              key={i}
              className={`chord-box ${item.correct ? "green" : "red"}`}
              style={{
                left: `${item.start * PIXELS_PER_SECOND}px`,
                top: `${item.stringIndex * 50}px`,
              }}
            >
              {item.chord}
            </div>
          ))}

          {STRINGS.map((_, i) => (
            <div key={i} className="string-line" style={{ top: `${i * 50}px` }} />
          ))}
        </div>
      </div>

      {/* 🟩 Feedback Section */}
      <div className="feedback-summary">
        <h3>🎧 Live Feedback</h3>
        <ul>
          {feedback.map((item, i) => (
            <li key={i}>
              {item.chord} ({item.start}s):{" "}
              {item.correct ? "✅ Correct" : "❌ Incorrect"}
            </li>
          ))}
        </ul>

        <div className="score-box">
          <p><strong>Accuracy:</strong> {accuracy || "N/A"}%</p>
          <p><strong>Level:</strong> {level || "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

export default Playground;
