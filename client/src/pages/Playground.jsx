import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./playground.css";

const PIXELS_PER_SECOND = 100;

const Playground = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadX, setPlayheadX] = useState(0);
  const audioRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("feedback");
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setFeedback(parsed);
      } else {
        alert("Feedback format invalid.");
        navigate("/upload-audio");
      }
    } catch (err) {
      console.error("Invalid JSON in feedback");
      navigate("/upload-audio");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && audioRef.current && scrollRef.current) {
        const currentTime = audioRef.current.currentTime;
        const x = currentTime * PIXELS_PER_SECOND;
        setPlayheadX(x);
        scrollRef.current.scrollLeft = x - 100;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlayheadX(0);
      };
    }
  }, []);

  const handlePlay = () => {
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  return (
    <div className="playground-container">
      <div className="header">
        <h2>🎶 Song Timeline</h2>
        <div className="controls">
          <button className="btn purple" onClick={handlePause}>⏸</button>
          <button className="btn grey" onClick={handlePlay}>▶️</button>
          <div className="tempo">
            Tempo:
            <button>0.5x</button>
            <button className="active">1x</button>
            <button>1.5x</button>
            <button>2x</button>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src="/your-audio.mp3" />

      {/* Scrollable Timeline with Real-time Playhead */}
      <div className="timeline-scroll" ref={scrollRef}>
        <div className="timeline-track">
          {/* Playhead */}
          <div className="playhead" style={{ left: `${playheadX}px` }} />

          {feedback.map((item, i) => (
            <div
              key={i}
              className={`timeline-chord ${item.correct ? "green" : "red"}`}
              style={{
                left: item.start * PIXELS_PER_SECOND,
                width: item.duration * PIXELS_PER_SECOND,
              }}
            >
              {item.chord}
            </div>
          ))}
        </div>
      </div>

      <div className="feedback-box">
        <h3>🟢 Live Feedback!</h3>
        <ul>
          {feedback.map((item, i) => (
            <li key={i}>
              {item.chord} ({item.start}s): {item.correct ? "✅ Correct" : "❌ Incorrect"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Playground;
