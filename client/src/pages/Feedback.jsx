import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const CHUNK_MS = 2000; // 2 seconds per chunk

const LiveFeedback = ({ expectedTimeline }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState([]); // [{chord, correct, timestamp}]
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);
  const chunkIndex = useRef(0);

  // Start/stop recording
  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new window.MediaRecorder(stream);
    setMediaRecorder(recorder);
    audioChunks.current = [];
    chunkIndex.current = 0;
    setFeedback([]);
    recorder.start(CHUNK_MS);

    recorder.ondataavailable = async (e) => {
      audioChunks.current.push(e.data);
      // Send chunk to backend for chord prediction
      const formData = new FormData();
      formData.append("audio", e.data, `chunk${chunkIndex.current}.webm`);
      try {
        const res = await axios.post("/api/predict-mic", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // Find expected chord for this chunk
        const expected = expectedTimeline[chunkIndex.current] || {};
        const isCorrect = res.data.chord === expected.chord;
        // Feedback logic: green=correct, red=wrong, yellow=late/off-beat
        let color = "🟩";
        if (!isCorrect) color = "🟥";
        // Optionally, add yellow for off-beat (implement timing logic)
        setFeedback((prev) => [
          ...prev,
          {
            chord: res.data.chord,
            correct: isCorrect,
            color,
            timestamp: res.data.timestamp,
          },
        ]);
        chunkIndex.current += 1;
      } catch (err) {
        setFeedback((prev) => [
          ...prev,
          { chord: "?", correct: false, color: "🟥", timestamp: null },
        ]);
      }
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
    };

    setIsRecording(true);
  };

  // Performance summary
  const accuracy =
    feedback.length > 0
      ? Math.round(
          (feedback.filter((f) => f.correct).length / feedback.length) * 100
        )
      : 0;

  return (
    <div className="flex flex-col items-center p-8">
      <h2 className="text-2xl font-bold mb-4">🎙️ Live Feedback</h2>
      <button
        className={`px-6 py-2 rounded ${isRecording ? "bg-red-500" : "bg-green-500"} text-white font-semibold mb-6`}
        onClick={handleRecord}
      >
        {isRecording ? "Stop" : "Start"} Recording
      </button>

      <div className="flex flex-row space-x-2 mb-4">
        {feedback.map((f, idx) => (
          <div
            key={idx}
            className={`w-8 h-8 flex items-center justify-center rounded ${
              f.color === "🟩"
                ? "bg-green-400"
                : f.color === "🟥"
                ? "bg-red-400"
                : "bg-yellow-300"
            }`}
            title={`Chord: ${f.chord || "?"} (${f.color})`}
          >
            {f.chord || "?"}
          </div>
        ))}
      </div>

      <div className="mt-4 text-lg">
        <b>Accuracy:</b> {accuracy}%
        <br />
        <b>Total Chords Played:</b> {feedback.length}
        <br />
        <b>Mistakes:</b> {feedback.filter((f) => !f.correct).length}
      </div>
    </div>
  );
};

export default LiveFeedback;
