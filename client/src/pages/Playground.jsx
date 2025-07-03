import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./playground.css";

const PIXELS_PER_SECOND = 100;
const STRINGS = ["E", "B", "G", "D", "A", "E"];
const socket = io("http://localhost:5000");

const Playground = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [level, setLevel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [micSummary, setMicSummary] = useState(null);
  const [status, setStatus] = useState("Idle");
const [log, setLog] = useState([]);

  const idealPath = localStorage.getItem("idealPath");
  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Load old feedback
  useEffect(() => {
    const raw = localStorage.getItem("feedback");
    const acc = localStorage.getItem("accuracy");
    const lvl = localStorage.getItem("level");

    if (!raw || !idealPath) {
      navigate("/upload-ideal");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setFeedback(parsed);
      if (acc) setAccuracy(acc);
      if (lvl) setLevel(lvl);
    } catch {
      navigate("/upload-ideal");
    }
  }, []);

  // Auto-scroll timeline
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && audioRef.current && timelineRef.current) {
        const scrollX = audioRef.current.currentTime * PIXELS_PER_SECOND * tempo;
        timelineRef.current.scrollLeft = scrollX - 100;
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, tempo]);

  // Socket listeners
  useEffect(() => {
    socket.on("chord-feedback", setLiveFeedback);
    socket.on("analysis-status", setStatus);
    return () => {
      socket.off("chord-feedback");
      socket.off("analysis-status");
    };
  }, []);

  useEffect(() => {
  socket.on("status", (msg) => {
    console.log("📡 Backend Status:", msg);
    setStatus(msg);
  });

  socket.on("chord-feedback", (data) => {
    console.log("🎵 Chord Feedback:", data);
    setLiveFeedback(data);
  });

  return () => {
    socket.off("status");
    socket.off("chord-feedback");
  };
}, []);

useEffect(() => {
  socket.on("status", (msg) => {
    setLog((prev) => [...prev, msg]);
    setStatus(msg);
  });

  socket.on("chord-feedback", (data) => {
    setLiveFeedback(data);
  });

  socket.on("mic-final-feedback", (data) => {
    console.log("🎤 Mic Final Feedback:", data.mic_summary);
    setMicSummary(data.mic_summary);
  });

  return () => {
    socket.off("status");
    socket.off("chord-feedback");
    socket.off("mic-final-feedback");
  };
}, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = tempo;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handlePracticeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !idealPath) return alert("Missing file or idealPath");

    const formData = new FormData();
    formData.append("practice", file);
    formData.append("idealPath", idealPath);

    const res = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (Array.isArray(data.feedback)) {
      localStorage.setItem("feedback", JSON.stringify(data.feedback));
      localStorage.setItem("accuracy", data.accuracy);
      localStorage.setItem("level", data.level);
      setFeedback(data.feedback);
      setAccuracy(data.accuracy);
      setLevel(data.level);
      alert("✅ Practice audio analyzed!");
    } else {
      alert("❌ Invalid feedback");
    }
  };

 const handleStartMicStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    // On chunk available, send it
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const arrayBuffer = reader.result;
          socket.emit("mic-audio-chunk", arrayBuffer); // Send chunk every second
        };
        reader.readAsArrayBuffer(e.data);
      }
    };

    recorder.onstop = () => {
      
      setStatus("Stopped");
       socket.emit("mic-audio-final");
    };

    mediaRecorderRef.current = recorder;
    recorder.start(1000); // 👈 capture 1-second chunks automatically
    setIsRecording(true);
    setStatus("🎤 Live Recording (1s chunks)");
  } catch (err) {
    alert("🎤 Mic access denied: " + err.message);
  }
};

  const handleStopMicStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
        socket.emit("mic-recording-end"); 
      setIsRecording(false);
    }
  };
   // ✅ Start mic recording and send every 10 sec
  /*const handleStartMicStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buffer) => {
            socket.emit("mic-audio-chunk", buffer); // 📤 Send 1 sec chunks
          });
        }
      };

      recorder.onstop = () => {
        socket.emit("mic-recording-end"); // 🛑 Finalize
      };

      recorder.start(1000); // ⏱️ Chunk every 10 seconds
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      alert("🎤 Mic access denied or error: " + err.message);
    }
  };

  // Stop mic stream
  const handleStopMicStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };*/

  // ⭐ Generate stars based on accuracy
  const renderStars = (accuracy) => {
    const count = Math.round((accuracy || 0) / 20); // 0–5 stars
    return "⭐".repeat(count);
  };

  // 🏅 Medal logic
  const getMedal = (accuracy) => {
    if (accuracy >= 85) return "🥇 Gold";
    if (accuracy >= 70) return "🥈 Silver";
    if (accuracy >= 50) return "🥉 Bronze";
    return "🎵 Keep Practicing";
  };

  // 💡 Tips based on level
  const getTips = (level) => {
    switch (level) {
      case "Beginner":
        return "Try slowing down tempo and focus on chord accuracy.";
      case "Intermediate":
        return "Work on timing and switching chords smoothly.";
      case "Advanced":
        return "Try performing with dynamic tempo or rhythm.";
      default:
        return "Upload and get feedback to improve.";
    }
  };

  return (
    <div className="playground-wrapper">
      {/* Navbar */}
      <div className="navbar">
        <h3>🎸 Aaroh AI Playground</h3>
        <label className="upload-practice-label">
          🎧 Upload Practice Audio:
          <input type="file" accept="audio/*" onChange={handlePracticeUpload} />
        </label>
        {isRecording ? (
          <button onClick={handleStopMicStream}>⛔ Stop Mic</button>
        ) : (
          <button onClick={handleStartMicStream}>🎙️ Start Mic</button>
        )}
      </div>

      {/* Controls */}
      <div className="header">
        <h2>🎶 Chord Feedback Timeline</h2>
        <div className="controls">
          <button onClick={togglePlay}>{isPlaying ? "⏸ Pause" : "▶️ Play"}</button>
          Tempo:
          <button onClick={() => setTempo(0.5)}>0.5x</button>
          <button onClick={() => setTempo(1)}>1x</button>
          <button onClick={() => setTempo(2)}>2x</button>
        </div>
      </div>

      {/* Audio */}
      <audio ref={audioRef} src={`http://localhost:5000${idealPath}`} />

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

      {/* Feedback Summary */}
      <div className="feedback-summary">
        <h3>📊 Performance Summary</h3>
        <p><strong>Status:</strong> {status}</p>
        {/* 🪵 Process Logs */}
<div className="log-box">
  <h4>📋 Process Logs</h4>
  <pre style={{ whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre>
</div>
        <p><strong>Accuracy:</strong> {accuracy || "N/A"}%</p>
        <p><strong>Level:</strong> {level || "N/A"}</p>
        <p><strong>Medal:</strong> {getMedal(accuracy)}</p>
        <p><strong>Stars:</strong> {renderStars(accuracy)}</p>
        <p><strong>Guidance:</strong> {getTips(level)}</p>

        {liveFeedback && (
          <div>
            <h3>🎤 Mic Final Feedback</h3>
            <pre>{JSON.stringify(liveFeedback, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playground;




/* ye code mic live chunk ko work kar raha hai 
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./playground.css";

const PIXELS_PER_SECOND = 100;
const STRINGS = ["E", "B", "G", "D", "A", "E"];
const socket = io("http://localhost:5000");

const Playground = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [level, setLevel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [liveChunks, setLiveChunks] = useState([]);


  const idealPath = localStorage.getItem("idealPath");
  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Load feedback data
  useEffect(() => {
    const raw = localStorage.getItem("feedback");
    const acc = localStorage.getItem("accuracy");
    const lvl = localStorage.getItem("level");

    if (!raw || !idealPath) {
      navigate("/upload-ideal");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setFeedback(parsed);
      if (acc) setAccuracy(acc);
      if (lvl) setLevel(lvl);
    } catch {
      navigate("/upload-ideal");
    }
  }, []);

  // Scroll timeline while playing
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && audioRef.current && timelineRef.current) {
        const scrollX = audioRef.current.currentTime * PIXELS_PER_SECOND * tempo;
        timelineRef.current.scrollLeft = scrollX - 100;
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, tempo]);

  // Receive final feedback from server
  useEffect(() => {
    socket.on("chord-feedback", (result) => {
      setLiveFeedback(result);
    });
    return () => {
      socket.off("chord-feedback");
    };
  }, []);
  useEffect(() => {
  socket.on("chord-feedback", (result) => {
    // Check if result is an array before spreading
    if (Array.isArray(result)) {
      setLiveChunks((prev) => [...prev, ...result]); // 🧠 Append live chunk feedback
    } else {
      console.error("Received non-iterable result for chord-feedback:", result);
    }
  });

  socket.on("summary-feedback", (summary) => {
    setAccuracy(summary.accuracy);
    setLevel(summary.level);
  });

  return () => {
    socket.off("chord-feedback");
    socket.off("summary-feedback");
  };
}, []);

  // Play/pause button
  const togglePlay = () => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = tempo;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  // Upload practice audio
  const handlePracticeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !idealPath) return alert("Missing file or idealPath");

    const formData = new FormData();
    formData.append("practice", file);
    formData.append("idealPath", idealPath);

    const res = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (Array.isArray(data.feedback)) {
      localStorage.setItem("feedback", JSON.stringify(data.feedback));
      localStorage.setItem("accuracy", data.accuracy);
      localStorage.setItem("level", data.level);
      setFeedback(data.feedback);
      setAccuracy(data.accuracy);
      setLevel(data.level);
      alert("✅ Practice audio analyzed!");
    } else {
      alert("❌ Invalid feedback");
    }
  };

  // ✅ Start mic recording and send every 10 sec
  const handleStartMicStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buffer) => {
            socket.emit("mic-audio-chunk", buffer); // 📤 Send 10 sec chunks
          });
        }
      };

      recorder.onstop = () => {
        socket.emit("mic-recording-end"); // 🛑 Finalize
      };

      recorder.start(10000); // ⏱️ Chunk every 10 seconds
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      alert("🎤 Mic access denied or error: " + err.message);
    }
  };

  // Stop mic stream
  const handleStopMicStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="playground-wrapper">
      {/* Navbar *///}
      /*<div className="navbar">
        <h3>🎸 Aaroh AI Playground</h3>
        <label className="upload-practice-label">
          🎧 Upload Practice Audio:
          <input type="file" accept="audio/*" onChange={handlePracticeUpload} />
        </label>
        {isRecording ? (
          <button onClick={handleStopMicStream}>⛔ Stop Mic</button>
        ) : (
          <button onClick={handleStartMicStream}>🎙️ Start Mic</button>
        )}
      </div>

      {/* Controls *///}
     /* <div className="header">
        <h2>🎶 Chord Feedback Timeline</h2>
        <div className="controls">
          <button onClick={togglePlay}>{isPlaying ? "⏸ Pause" : "▶️ Play"}</button>
          Tempo:
          <button onClick={() => setTempo(0.5)}>0.5x</button>
          <button onClick={() => setTempo(1)}>1x</button>
          <button onClick={() => setTempo(2)}>2x</button>
        </div>
      </div>

      {/* Ideal Audio *///}
    /*  <audio ref={audioRef} src={`http://localhost:5000${idealPath}`} />

      {/* Timeline *///}
     /* <div className="timeline-container" ref={timelineRef}>
        <div className="timeline-track">
          <div className="playhead" />
          {feedback.concat(liveChunks).map((item, i) => (
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

      {/* Feedback Summary *///}
     /* <div className="feedback-summary">
        <h3>🎧 Practice Feedback Summary</h3>
        <p><strong>Accuracy:</strong> {accuracy || "N/A"}%</p>
        <p><strong>Level:</strong> {level || "N/A"}</p>

        {liveFeedback && (
          <div>
            <h3>🎤 Mic Final Feedback</h3>
            <pre>{JSON.stringify(liveFeedback, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playground;*/






/*must animation and chord 
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./playground.css";

const PIXELS_PER_SECOND = 100;
const STRINGS = ["E", "B", "G", "D", "A", "E"];

const Playground = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [level, setLevel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const idealPath = localStorage.getItem("idealPath");
  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    const raw = localStorage.getItem("feedback");
    const acc = localStorage.getItem("accuracy");
    const lvl = localStorage.getItem("level");

    if (!raw || !idealPath) {
      navigate("/upload-ideal");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setFeedback(parsed);
      if (acc) setAccuracy(acc);
      if (lvl) setLevel(lvl);
    } catch {
      navigate("/upload-ideal");
    }
  }, []);

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
    if (!audioRef.current) return;
    audioRef.current.playbackRate = tempo;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handlePracticeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !idealPath) return alert("Missing practice file or idealPath");

    const formData = new FormData();
    formData.append("practice", file);
    formData.append("idealPath", idealPath);

    const res = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (Array.isArray(data.feedback)) {
      localStorage.setItem("feedback", JSON.stringify(data.feedback));
      localStorage.setItem("accuracy", data.accuracy);
      localStorage.setItem("level", data.level);
      setFeedback(data.feedback);
      setAccuracy(data.accuracy);
      setLevel(data.level);
      alert("✅ Practice analysis updated!");
    } else {
      alert("❌ Invalid feedback from backend");
    }
  };

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("practice", blob, "live-practice.wav");
      formData.append("idealPath", idealPath);

      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (Array.isArray(data.feedback)) {
        localStorage.setItem("feedback", JSON.stringify(data.feedback));
        localStorage.setItem("accuracy", data.accuracy);
        localStorage.setItem("level", data.level);
        setFeedback(data.feedback);
        setAccuracy(data.accuracy);
        setLevel(data.level);
        alert("🎤 Mic practice analyzed!");
      } else {
        alert("❌ Invalid mic feedback");
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
    setTimeout(() => {
      mediaRecorder.stop();
      setIsRecording(false);
    }, 10000); // 10 seconds recording
  };

  return (
    <div className="playground-wrapper">
      {/* 🧭 Navbar *///}
      /*<div className="navbar">
        <h3>🎸 Aaroh AI Playground</h3>
        <label className="upload-practice-label">
          🎤 Upload Practice Audio:
          <input type="file" accept="audio/*" onChange={handlePracticeUpload} />
        </label>
        <button onClick={handleStartRecording} disabled={isRecording}>
          🎙️ {isRecording ? "Recording..." : "Start Mic Mode"}
        </button>
      </div>

      {/* 🎛️ Controls *///}
     /* <div className="header">
        <h2>🎶 Chord Feedback Timeline</h2>
        <div className="controls">
          <button onClick={togglePlay}>{isPlaying ? "⏸ Pause" : "▶️ Play"}</button>
          Tempo:
          <button onClick={() => setTempo(0.5)}>0.5x</button>
          <button onClick={() => setTempo(1)}>1x</button>
          <button onClick={() => setTempo(2)}>2x</button>
        </div>
      </div>

      {/* 🎵 Audio *///}
     /* <audio ref={audioRef} src={`http://localhost:5000${idealPath}`} />

      {/* 📈 Timeline *///}
      /*<div className="timeline-container" ref={timelineRef}>
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

      {/* 📊 Feedback *///}
      /*<div className="feedback-summary">
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

export default Playground;*/



/*import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./playground.css";

const PIXELS_PER_SECOND = 100;
const STRINGS = ["E", "B", "G", "D", "A", "E"];

const Playground = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [level, setLevel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(1);
  const audioRef = useRef(null);
  const timelineRef = useRef(null);

  // ⏬ Load ideal audio and feedback
  useEffect(() => {
    const raw = localStorage.getItem("feedback");
    const acc = localStorage.getItem("accuracy");
    const lvl = localStorage.getItem("level");
    const ideal = localStorage.getItem("idealPath");

    if (!raw || !ideal) {
      navigate("/upload-ideal");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setFeedback(parsed);
      if (acc) setAccuracy(acc);
      if (lvl) setLevel(lvl);
    } catch {
      navigate("/upload-ideal");
    }
  }, []);

  // 🏃 Auto-scroll timeline
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
    if (!audioRef.current) return;
    audioRef.current.playbackRate = tempo;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePracticeUpload = async (e) => {
    const file = e.target.files[0];
    const idealPath = localStorage.getItem("idealPath");
    if (!file || !idealPath) return alert("Missing file or ideal path");

    const formData = new FormData();
    formData.append("practice", file);
    formData.append("idealPath", idealPath);

    try {
      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (Array.isArray(data.feedback)) {
        localStorage.setItem("feedback", JSON.stringify(data.feedback));
        localStorage.setItem("accuracy", data.accuracy);
        localStorage.setItem("level", data.level);
        setFeedback(data.feedback);
        setAccuracy(data.accuracy);
        setLevel(data.level);
        alert("✅ Practice analysis updated!");
      } else {
        alert("❌ Invalid feedback from backend");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("❌ Practice upload failed");
    }
  };

  const idealPath = localStorage.getItem("idealPath");

  return (
    <div className="playground-wrapper">
      {/* 🧭 Navbar *///}
      /*<div className="navbar">
        <h3>🎸 Aaroh AI Playground</h3>
        <label className="upload-practice-label">
          🎤 Upload Practice Audio:
          <input type="file" accept="audio/*" onChange={handlePracticeUpload} />
        </label>
      </div>

      {/* 🎛️ Controls *///}
      /*
      <div className="header">
        <h2>🎶 Chord Feedback Timeline</h2>
        <div className="controls">
          <button onClick={togglePlay}>{isPlaying ? "⏸ Pause" : "▶️ Play"}</button>
          Tempo:
          <button onClick={() => setTempo(0.5)}>0.5x</button>
          <button onClick={() => setTempo(1)}>1x</button>
          <button onClick={() => setTempo(2)}>2x</button>
        </div>
      </div>

      {/* 🎵 Audio *///}
      /*
      <audio ref={audioRef} src={`http://localhost:5000${idealPath}`} />

      {/* 📈 Timeline *///}
      /*<div className="timeline-container" ref={timelineRef}>
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

      {/* 📊 Feedback *///}
       /*
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

export default Playground;*/
